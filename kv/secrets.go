package kv

import (
	"context"
	"errors"
	"fmt"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv/internal"
	"google.golang.org/protobuf/proto"
)

var wrappedDEKID = []byte("secrets/wrapped-dek/v1")

// InitializeSecretDEK loads or creates a wrapped DEK in KV and configures
// kv/internal secret encryption for this process.
func (s *Service) InitializeSecretDEK(ctx context.Context, masterKey []byte) error {
	// Fail closed across restarts/reconfigurations in the same process.
	internal.SetSecretDEK(nil)

	var wrappedDEK []byte
	if err := s.kv.View(ctx, func(tx Tx) error {
		v, err := tx.Bucket(configBucket).Get(wrappedDEKID)
		if err != nil {
			return err
		}
		if len(v) > 0 {
			wrappedDEK = append([]byte(nil), v...)
		}
		return nil
	}); err != nil {
		return err
	}

	if len(wrappedDEK) == 0 {
		if len(masterKey) == 0 {
			encryptedExists, err := s.hasEncryptedSecrets(ctx)
			if err != nil {
				return err
			}
			if encryptedExists {
				return errors.New("encrypted secrets exist but no wrapped DEK or secrets master key is configured")
			}
			return nil
		}

		dek, err := internal.GenerateDEK()
		if err != nil {
			return err
		}
		wrapped, err := internal.WrapDEK(masterKey, dek)
		if err != nil {
			return err
		}

		if err := s.kv.Update(ctx, func(tx Tx) error {
			return tx.Bucket(configBucket).Put(wrappedDEKID, wrapped)
		}); err != nil {
			return err
		}

		internal.SetSecretDEK(dek)
		if err := s.migrateLegacyPlaintextSecrets(ctx); err != nil {
			return err
		}
		return nil
	}

	if len(masterKey) == 0 {
		return errors.New("wrapped DEK exists but no secrets master key is configured")
	}

	dek, err := internal.UnwrapDEK(masterKey, wrappedDEK)
	if err != nil {
		return fmt.Errorf("unable to unwrap stored DEK: %w", err)
	}

	internal.SetSecretDEK(dek)
	if err := s.migrateLegacyPlaintextSecrets(ctx); err != nil {
		return err
	}
	return nil
}

// RewrapSecretDEK rotates the master key by rewrapping the stored DEK.
// It does not re-encrypt persisted source/server secrets.
func (s *Service) RewrapSecretDEK(ctx context.Context, oldMasterKey, newMasterKey []byte) error {
	var wrappedDEK []byte
	if err := s.kv.View(ctx, func(tx Tx) error {
		v, err := tx.Bucket(configBucket).Get(wrappedDEKID)
		if err != nil {
			return err
		}
		if len(v) == 0 {
			return errors.New("wrapped DEK not found")
		}
		wrappedDEK = append([]byte(nil), v...)
		return nil
	}); err != nil {
		return err
	}

	dek, err := internal.UnwrapDEK(oldMasterKey, wrappedDEK)
	if err != nil {
		return fmt.Errorf("unable to unwrap stored DEK with old master key: %w", err)
	}
	rewrapped, err := internal.WrapDEK(newMasterKey, dek)
	if err != nil {
		return fmt.Errorf("unable to wrap DEK with new master key: %w", err)
	}
	return s.kv.Update(ctx, func(tx Tx) error {
		return tx.Bucket(configBucket).Put(wrappedDEKID, rewrapped)
	})
}

// DisableSecretEncryption decrypts persisted secrets back to plaintext and
// removes the wrapped DEK. Requires the current master key.
func (s *Service) DisableSecretEncryption(ctx context.Context, masterKey []byte) error {
	if len(masterKey) == 0 {
		return errors.New("secrets master key is required")
	}

	var wrappedDEK []byte
	if err := s.kv.View(ctx, func(tx Tx) error {
		v, err := tx.Bucket(configBucket).Get(wrappedDEKID)
		if err != nil {
			return err
		}
		if len(v) == 0 {
			return errors.New("wrapped DEK not found")
		}
		wrappedDEK = append([]byte(nil), v...)
		return nil
	}); err != nil {
		return err
	}

	dek, err := internal.UnwrapDEK(masterKey, wrappedDEK)
	if err != nil {
		return fmt.Errorf("unable to unwrap stored DEK: %w", err)
	}

	if err := s.kv.Update(ctx, func(tx Tx) error {
		if err := rewriteEncryptedSecretsToPlaintext(tx, dek); err != nil {
			return err
		}
		return tx.Bucket(configBucket).Delete(wrappedDEKID)
	}); err != nil {
		return err
	}

	internal.SetSecretDEK(nil)
	return nil
}

func rewriteEncryptedSecretsToPlaintext(tx Tx, dek []byte) error {
	type sourceRewrite struct {
		key []byte
		src chronograf.Source
	}
	type serverRewrite struct {
		key []byte
		srv chronograf.Server
	}

	var sourceRewrites []sourceRewrite
	var serverRewrites []serverRewrite

	internal.SetSecretDEK(dek)
	defer internal.SetSecretDEK(nil)

	if err := tx.Bucket(sourcesBucket).ForEach(func(k, v []byte) error {
		var pb internal.Source
		if err := proto.Unmarshal(v, &pb); err != nil {
			return err
		}
		if !sourceHasEncryptedEncoding(pb) {
			return nil
		}
		var src chronograf.Source
		if err := internal.UnmarshalSource(v, &src); err != nil {
			return err
		}
		sourceRewrites = append(sourceRewrites, sourceRewrite{key: append([]byte(nil), k...), src: src})
		return nil
	}); err != nil {
		return err
	}

	if err := tx.Bucket(serversBucket).ForEach(func(k, v []byte) error {
		var pb internal.Server
		if err := proto.Unmarshal(v, &pb); err != nil {
			return err
		}
		if pb.GetPasswordEncoding() != internal.SecretEncoding_ENCRYPTED_V1 {
			return nil
		}
		var srv chronograf.Server
		if err := internal.UnmarshalServer(v, &srv); err != nil {
			return err
		}
		serverRewrites = append(serverRewrites, serverRewrite{key: append([]byte(nil), k...), srv: srv})
		return nil
	}); err != nil {
		return err
	}

	internal.SetSecretDEK(nil)

	for _, rw := range sourceRewrites {
		plaintext, err := internal.MarshalSource(rw.src)
		if err != nil {
			return err
		}
		if err := tx.Bucket(sourcesBucket).Put(rw.key, plaintext); err != nil {
			return err
		}
	}

	for _, rw := range serverRewrites {
		plaintext, err := internal.MarshalServer(rw.srv)
		if err != nil {
			return err
		}
		if err := tx.Bucket(serversBucket).Put(rw.key, plaintext); err != nil {
			return err
		}
	}

	return nil
}

func (s *Service) hasEncryptedSecrets(ctx context.Context) (bool, error) {
	encrypted := false
	if err := s.kv.View(ctx, func(tx Tx) error {
		sourcesEncrypted, err := hasEncryptedSources(tx)
		if err != nil {
			return err
		}
		if sourcesEncrypted {
			encrypted = true
			return nil
		}

		serversEncrypted, err := hasEncryptedServers(tx)
		if err != nil {
			return err
		}
		if serversEncrypted {
			encrypted = true
		}
		return nil
	}); err != nil {
		return false, err
	}
	return encrypted, nil
}

func hasEncryptedSources(tx Tx) (bool, error) {
	encrypted := false
	if err := tx.Bucket(sourcesBucket).ForEach(func(k, v []byte) error {
		var pb internal.Source
		if err := proto.Unmarshal(v, &pb); err != nil {
			return err
		}
		if sourceHasEncryptedEncoding(pb) {
			encrypted = true
		}
		return nil
	}); err != nil {
		return false, err
	}
	return encrypted, nil
}

func hasEncryptedServers(tx Tx) (bool, error) {
	encrypted := false
	if err := tx.Bucket(serversBucket).ForEach(func(k, v []byte) error {
		var pb internal.Server
		if err := proto.Unmarshal(v, &pb); err != nil {
			return err
		}
		if pb.GetPasswordEncoding() == internal.SecretEncoding_ENCRYPTED_V1 {
			encrypted = true
		}
		return nil
	}); err != nil {
		return false, err
	}
	return encrypted, nil
}

func (s *Service) migrateLegacyPlaintextSecrets(ctx context.Context) error {
	return s.kv.Update(ctx, func(tx Tx) error {
		if err := migrateSourcesBucket(tx); err != nil {
			return err
		}
		if err := migrateServersBucket(tx); err != nil {
			return err
		}
		return nil
	})
}

func migrateSourcesBucket(tx Tx) error {
	b := tx.Bucket(sourcesBucket)

	var rewrites []struct {
		key []byte
		val []byte
	}

	if err := b.ForEach(func(k, v []byte) error {
		var pb internal.Source
		if err := proto.Unmarshal(v, &pb); err != nil {
			return err
		}
		if !sourceNeedsSecretMigration(pb) {
			return nil
		}

		var src chronograf.Source
		if err := internal.UnmarshalSource(v, &src); err != nil {
			return err
		}
		migrated, err := internal.MarshalSource(src)
		if err != nil {
			return err
		}

		rewrites = append(rewrites, struct {
			key []byte
			val []byte
		}{
			key: append([]byte(nil), k...),
			val: migrated,
		})
		return nil
	}); err != nil {
		return err
	}

	for _, rw := range rewrites {
		if err := b.Put(rw.key, rw.val); err != nil {
			return err
		}
	}
	return nil
}

func migrateServersBucket(tx Tx) error {
	b := tx.Bucket(serversBucket)

	var rewrites []struct {
		key []byte
		val []byte
	}

	if err := b.ForEach(func(k, v []byte) error {
		var pb internal.Server
		if err := proto.Unmarshal(v, &pb); err != nil {
			return err
		}
		if pb.Password == "" || pb.GetPasswordEncoding() == internal.SecretEncoding_ENCRYPTED_V1 {
			return nil
		}

		var srv chronograf.Server
		if err := internal.UnmarshalServer(v, &srv); err != nil {
			return err
		}
		migrated, err := internal.MarshalServer(srv)
		if err != nil {
			return err
		}

		rewrites = append(rewrites, struct {
			key []byte
			val []byte
		}{
			key: append([]byte(nil), k...),
			val: migrated,
		})
		return nil
	}); err != nil {
		return err
	}

	for _, rw := range rewrites {
		if err := b.Put(rw.key, rw.val); err != nil {
			return err
		}
	}
	return nil
}

func sourceNeedsSecretMigration(pb internal.Source) bool {
	return (pb.Password != "" && pb.GetPasswordEncoding() != internal.SecretEncoding_ENCRYPTED_V1) ||
		(pb.SharedSecret != "" && pb.GetSharedSecretEncoding() != internal.SecretEncoding_ENCRYPTED_V1) ||
		(pb.ManagementToken != "" && pb.GetManagementTokenEncoding() != internal.SecretEncoding_ENCRYPTED_V1) ||
		(pb.DatabaseToken != "" && pb.GetDatabaseTokenEncoding() != internal.SecretEncoding_ENCRYPTED_V1)
}

func sourceHasEncryptedEncoding(pb internal.Source) bool {
	return pb.GetPasswordEncoding() == internal.SecretEncoding_ENCRYPTED_V1 ||
		pb.GetSharedSecretEncoding() == internal.SecretEncoding_ENCRYPTED_V1 ||
		pb.GetManagementTokenEncoding() == internal.SecretEncoding_ENCRYPTED_V1 ||
		pb.GetDatabaseTokenEncoding() == internal.SecretEncoding_ENCRYPTED_V1
}
