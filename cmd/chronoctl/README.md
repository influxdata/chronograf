## Chronoctl

Chronoctl is a tool to interact with an instance of a chronograf's bolt database.

```
Available commands:
  add-superadmin  Creates a new superadmin user  (bolt specific)
  gen-secrets-master-key Generates a secrets master key
  list-users      Lists users                    (bolt specific)
  disable-secrets-encryption Disables secrets encryption and removes wrapped DEK
  rewrap-secrets-master-key Rewraps stored DEK with new master key
  migrate         Migrate db (beta)
```

### Secrets Encryption Commands

Use these commands when Chronograf secret-at-rest encryption is enabled.

##### Generate Secrets Master Key
Generate a base64-encoded 32-byte key:

```sh
$ chronoctl gen-secrets-master-key
```

Write the generated key to a file (0600):

```sh
$ chronoctl gen-secrets-master-key --out ./chronograf-secrets.key
```

##### Rewrap Secrets Master Key
Rotate the secrets master key by rewrapping the stored DEK:

```sh
$ chronoctl rewrap-secrets-master-key \
    --bolt-path ./chronograf-v1.db \
    --old-secrets-master-key-file ./old.key \
    --new-secrets-master-key-file ./new.key
```

After successful rewrap, start Chronograf with the new key.

##### Disable Secrets Encryption
Disable secret encryption by decrypting persisted secrets to plaintext and
removing the wrapped DEK:

```sh
$ chronoctl disable-secrets-encryption \
    --bolt-path ./chronograf-v1.db \
    --secrets-master-key-file ./current.key
```

After successful disable:
- Chronograf no longer requires `--secrets-master-key` / `--secrets-master-key-file`
- persisted secrets are plaintext again

Important:
- `rewrap-secrets-master-key` changes only master-key wrapping and does not re-encrypt secret records.
- `disable-secrets-encryption` is a destructive security downgrade.


### Migrate

The `migrate` command allows you to migrate your chronograf configuration store. It is highly recommended that you make a backup of all databases involved before running a migration as there is no guarantee that there will be no data loss. When specifying an etcd endpoint, the URI must begin with `etcd://`. It is preferred that you prefix `bolt://` to an absolute path when specifying a local bolt db file, but a lone relative path is also accepted without the prefix. If there is authentication on etcd, use the standard URI format to define a username/password: `[scheme:][//[userinfo@]host][/]path`.
There is currently no cleanup for a failed migration, so keep that in mind before migrating to a db that contains other important data.


##### Usage
```
chronoctl migrate [OPTIONS]

OPTIONS
    -f, --from= Full path to boltDB file or etcd (e.g. 'bolt:///path/to/chronograf-v1.db' or 'etcd://user:pass@localhost:2379 (default: chronograf-v1.db)
    -t, --to=   Full path to boltDB file or etcd (e.g. 'bolt:///path/to/chronograf-v1.db' or 'etcd://user:pass@localhost:2379 (default: etcd://localhost:2379)
```


##### Example
```sh
$ chronoctl migrate -f etcd://localhost:2379 -t bolt:///tmp/chronograf.db
# Performing non-idempotent db migration from "etcd://localhost:2379" to "bolt:///tmp/chronograf.db"...
#   Saved 1 organizations.
#   Saved 1 organization configs.
#   Saved 1 dashboards.
#   Saved 3 mappings.
#   Saved 0 servers.
#   Saved 1 sources.
# Migration successful!

$ chronoctl migrate -f ./chronograf-v1.db -t etcd://localhost:2379
# Performing non-idempotent db migration from "./chronograf-v1.db" to "etcd://localhost:2379"...
#   Saved 1 organizations.
#   Saved 1 organization configs.
#   Saved 1 dashboards.
#   Saved 3 mappings.
#   Saved 0 servers.
#   Saved 1 sources.
# Migration successful!
```
