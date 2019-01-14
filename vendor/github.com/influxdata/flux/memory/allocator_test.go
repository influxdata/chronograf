package memory_test

import (
	"testing"

	"github.com/influxdata/flux/memory"
)

func TestAllocator_MaxAfterFree(t *testing.T) {
	allocator := &memory.Allocator{}
	if err := allocator.Allocate(64); err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	if want, got := int64(64), allocator.Allocated(); want != got {
		t.Fatalf("unexpected allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}
	if want, got := int64(64), allocator.MaxAllocated(); want != got {
		t.Fatalf("unexpected max allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}

	// Free should restore the memory to zero, but have max be the same.
	allocator.Free(64)

	if want, got := int64(0), allocator.Allocated(); want != got {
		t.Fatalf("unexpected allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}
	if want, got := int64(64), allocator.MaxAllocated(); want != got {
		t.Fatalf("unexpected max allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}

	// Allocate a smaller amount of memory and the max should still be 64.
	if err := allocator.Allocate(32); err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	if want, got := int64(32), allocator.Allocated(); want != got {
		t.Fatalf("unexpected allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}
	if want, got := int64(64), allocator.MaxAllocated(); want != got {
		t.Fatalf("unexpected max allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}
}

func TestAllocator_Limit(t *testing.T) {
	maxLimit := int64(64)
	allocator := &memory.Allocator{Limit: &maxLimit}
	if err := allocator.Allocate(64); err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	if want, got := int64(64), allocator.Allocated(); want != got {
		t.Fatalf("unexpected allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}
	if want, got := int64(64), allocator.MaxAllocated(); want != got {
		t.Fatalf("unexpected max allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}

	// Attempts to allocate more should result in an error.
	if err := allocator.Allocate(1); err == nil {
		t.Fatal("expected error")
	}

	// The counts should not change.
	if want, got := int64(64), allocator.Allocated(); want != got {
		t.Fatalf("unexpected allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}
	if want, got := int64(64), allocator.MaxAllocated(); want != got {
		t.Fatalf("unexpected max allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}

	// Free should restore the memory so we can allocate more.
	allocator.Free(64)

	if want, got := int64(0), allocator.Allocated(); want != got {
		t.Fatalf("unexpected allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}
	if want, got := int64(64), allocator.MaxAllocated(); want != got {
		t.Fatalf("unexpected max allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}

	// This allocation should succeed.
	if err := allocator.Allocate(32); err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	if want, got := int64(32), allocator.Allocated(); want != got {
		t.Fatalf("unexpected allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}
	if want, got := int64(64), allocator.MaxAllocated(); want != got {
		t.Fatalf("unexpected max allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}

	// This allocation should fail.
	if err := allocator.Allocate(64); err == nil {
		t.Fatal("expected error")
	}

	if want, got := int64(32), allocator.Allocated(); want != got {
		t.Fatalf("unexpected allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}
	if want, got := int64(64), allocator.MaxAllocated(); want != got {
		t.Fatalf("unexpected max allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}
}

func TestAllocator_Free(t *testing.T) {
	allocator := &memory.Allocator{}
	if err := allocator.Allocate(64); err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	if want, got := int64(64), allocator.Allocated(); want != got {
		t.Fatalf("unexpected allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}
	if want, got := int64(64), allocator.MaxAllocated(); want != got {
		t.Fatalf("unexpected max allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}

	// Free the memory.
	allocator.Free(64)

	if want, got := int64(0), allocator.Allocated(); want != got {
		t.Fatalf("unexpected allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}
	if want, got := int64(64), allocator.MaxAllocated(); want != got {
		t.Fatalf("unexpected max allocated count -want/+got\n\t- %d\n\t+ %d", want, got)
	}
}
