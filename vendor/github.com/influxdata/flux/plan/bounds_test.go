package plan_test

import (
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"

	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/plan/plantest"
	"github.com/influxdata/flux/values"
)

func TestBoundsIntersect(t *testing.T) {
	now := time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC)
	tests := []struct {
		name string
		now  time.Time
		a, b *plan.Bounds
		want *plan.Bounds
	}{
		{
			name: "contained",
			a: &plan.Bounds{
				Start: values.ConvertTime(now.Add(-1 * time.Hour)),
				Stop:  values.ConvertTime(now),
			},
			b: &plan.Bounds{
				Start: values.ConvertTime(now.Add(-30 * time.Minute)),
				Stop:  values.ConvertTime(now),
			},
			want: &plan.Bounds{
				Start: values.ConvertTime(now.Add(-30 * time.Minute)),
				Stop:  values.ConvertTime(now),
			},
		},
		{
			name: "contained sym",
			now:  time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			a: &plan.Bounds{
				Start: values.ConvertTime(now.Add(-30 * time.Minute)),
				Stop:  values.ConvertTime(now),
			},
			b: &plan.Bounds{
				Start: values.ConvertTime(now.Add(-1 * time.Hour)),
				Stop:  values.ConvertTime(now),
			},
			want: &plan.Bounds{
				Start: values.ConvertTime(now.Add(-30 * time.Minute)),
				Stop:  values.ConvertTime(now),
			},
		},
		{
			name: "no overlap",
			now:  time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			a: &plan.Bounds{
				Start: values.ConvertTime(now.Add(-1 * time.Hour)),
				Stop:  values.ConvertTime(now),
			},
			b: &plan.Bounds{
				Start: values.ConvertTime(now.Add(-3 * time.Hour)),
				Stop:  values.ConvertTime(now.Add(-2 * time.Hour)),
			},
			want: plan.EmptyBounds,
		},
		{
			name: "overlap",
			now:  time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			a: &plan.Bounds{
				Start: values.ConvertTime(now.Add(-1 * time.Hour)),
				Stop:  values.ConvertTime(now),
			},
			b: &plan.Bounds{
				Start: values.ConvertTime(now.Add(-2 * time.Hour)),
				Stop:  values.ConvertTime(now.Add(-30 * time.Minute)),
			},
			want: &plan.Bounds{
				Start: values.ConvertTime(now.Add(-1 * time.Hour)),
				Stop:  values.ConvertTime(now.Add(-30 * time.Minute)),
			},
		},
		{
			name: "absolute times",
			a: &plan.Bounds{
				Start: values.ConvertTime(time.Date(2018, time.January, 1, 0, 1, 0, 0, time.UTC)),
				Stop:  values.ConvertTime(time.Date(2018, time.January, 1, 0, 3, 0, 0, time.UTC)),
			},
			b: &plan.Bounds{
				Start: values.ConvertTime(time.Date(2018, time.January, 1, 0, 4, 0, 0, time.UTC)),
				Stop:  values.ConvertTime(time.Date(2018, time.January, 1, 0, 5, 0, 0, time.UTC)),
			},
			want: plan.EmptyBounds,
		},
		{
			name: "intersect with empty returns empty",
			now:  time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			a: &plan.Bounds{
				Start: values.ConvertTime(time.Date(2018, time.January, 1, 0, 15, 0, 0, time.UTC)),
				Stop:  values.ConvertTime(now),
			},
			b:    plan.EmptyBounds,
			want: plan.EmptyBounds,
		},
		{
			name: "intersect with empty returns empty sym",
			now:  time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			a:    plan.EmptyBounds,
			b: &plan.Bounds{
				Start: values.ConvertTime(time.Date(2018, time.January, 1, 0, 15, 0, 0, time.UTC)),
				Stop:  values.ConvertTime(now),
			},
			want: plan.EmptyBounds,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.a.Intersect(tt.b)
			if !cmp.Equal(got, tt.want) {
				t.Errorf("unexpected bounds -want/+got:\n%s", cmp.Diff(tt.want, got))
			}
		})
	}
}

func TestBounds_Union(t *testing.T) {
	now := time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC)
	tests := []struct {
		name string
		now  time.Time
		a, b *plan.Bounds
		want *plan.Bounds
	}{
		{
			name: "basic case",
			a: &plan.Bounds{
				Start: values.ConvertTime(time.Date(2018, time.January, 1, 0, 1, 0, 0, time.UTC)),
				Stop:  values.ConvertTime(time.Date(2018, time.January, 1, 0, 3, 0, 0, time.UTC)),
			},
			b: &plan.Bounds{
				Start: values.ConvertTime(time.Date(2018, time.January, 1, 0, 2, 0, 0, time.UTC)),
				Stop:  values.ConvertTime(time.Date(2018, time.January, 1, 0, 4, 0, 0, time.UTC)),
			},
			want: &plan.Bounds{
				Start: values.ConvertTime(time.Date(2018, time.January, 1, 0, 1, 0, 0, time.UTC)),
				Stop:  values.ConvertTime(time.Date(2018, time.January, 1, 0, 4, 0, 0, time.UTC)),
			},
		},
		{
			name: "union with empty returns empty",
			a: &plan.Bounds{
				Start: values.ConvertTime(time.Date(2018, time.January, 1, 0, 15, 0, 0, time.UTC)),
				Stop:  values.ConvertTime(now),
			},
			b:    plan.EmptyBounds,
			want: plan.EmptyBounds,
		},
		{
			name: "union with empty returns empty sym",
			now:  time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			a:    plan.EmptyBounds,
			b: &plan.Bounds{
				Start: values.ConvertTime(time.Date(2018, time.January, 1, 0, 15, 0, 0, time.UTC)),
				Stop:  values.ConvertTime(now),
			},
			want: plan.EmptyBounds,
		},
		{
			name: "no overlap",
			now:  time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			a: &plan.Bounds{
				Start: values.ConvertTime(time.Date(2018, time.January, 1, 0, 15, 0, 0, time.UTC)),
				Stop:  values.ConvertTime(time.Date(2018, time.January, 1, 0, 20, 0, 0, time.UTC)),
			},
			b: &plan.Bounds{
				Start: values.ConvertTime(time.Date(2018, time.January, 1, 0, 45, 0, 0, time.UTC)),
				Stop:  values.ConvertTime(time.Date(2018, time.January, 1, 0, 50, 0, 0, time.UTC)),
			},
			want: &plan.Bounds{
				Start: values.ConvertTime(time.Date(2018, time.January, 1, 0, 15, 0, 0, time.UTC)),
				Stop:  values.ConvertTime(time.Date(2018, time.January, 1, 0, 50, 0, 0, time.UTC)),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.a.Union(tt.b)
			if !cmp.Equal(got, tt.want) {
				t.Errorf("unexpected bounds -want/+got:\n%s", cmp.Diff(tt.want, got))
			}
		})
	}
}

func TestBounds_IsEmpty(t *testing.T) {
	now := time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC)
	tests := []struct {
		name   string
		now    time.Time
		bounds *plan.Bounds
		want   bool
	}{
		{
			name: "empty bounds / start == stop",
			now:  time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			bounds: &plan.Bounds{
				Start: values.ConvertTime(now),
				Stop:  values.ConvertTime(now),
			},
			want: true,
		},
		{
			name: "empty bounds / absolute now == relative now",
			now:  time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			bounds: &plan.Bounds{
				Start: values.ConvertTime(now),
				Stop:  values.ConvertTime(time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC)),
			},
			want: true,
		},
		{
			name: "start > stop",
			now:  time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			bounds: &plan.Bounds{
				Start: values.ConvertTime(now.Add(time.Hour)),
				Stop:  values.ConvertTime(now),
			},
			want: true,
		},
		{
			name: "start < stop",
			now:  time.Date(2018, time.August, 14, 11, 0, 0, 0, time.UTC),
			bounds: &plan.Bounds{
				Start: values.ConvertTime(now.Add(-1 * time.Hour)),
				Stop:  values.ConvertTime(now),
			},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.bounds.IsEmpty()
			if got != tt.want {
				t.Errorf("unexpected result for bounds.IsEmpty(): got %t, want %t", got, tt.want)
			}
		})
	}
}

// A BoundsAwareProcedureSpec that intersects its bounds with its predecessors' bounds
type mockBoundsIntersectProcedureSpec struct {
	plan.DefaultCost
	bounds *plan.Bounds
}

func (m *mockBoundsIntersectProcedureSpec) Kind() plan.ProcedureKind {
	return "mock-intersect-bounds"
}

func (m *mockBoundsIntersectProcedureSpec) Copy() plan.ProcedureSpec {
	return &mockBoundsIntersectProcedureSpec{}
}

func (m *mockBoundsIntersectProcedureSpec) TimeBounds(predecessorBounds *plan.Bounds) *plan.Bounds {
	if predecessorBounds != nil {
		return predecessorBounds.Intersect(m.bounds)
	}
	return m.bounds
}

// A BoundsAwareProcedureSpec that shifts its predecessors' bounds
type mockBoundsShiftProcedureSpec struct {
	plan.DefaultCost
	by values.Duration
}

func (m *mockBoundsShiftProcedureSpec) Kind() plan.ProcedureKind {
	return "mock-shift-bounds"
}

func (m *mockBoundsShiftProcedureSpec) Copy() plan.ProcedureSpec {
	return &mockBoundsShiftProcedureSpec{}
}

func (m *mockBoundsShiftProcedureSpec) TimeBounds(predecessorBounds *plan.Bounds) *plan.Bounds {
	if predecessorBounds != nil {
		return predecessorBounds.Shift(m.by)
	}
	return nil
}

// Create a PlanNode with id and mockBoundsIntersectProcedureSpec
func makeBoundsNode(id string, bounds *plan.Bounds) plan.PlanNode {
	return plan.CreatePhysicalNode(plan.NodeID(id),
		&mockBoundsIntersectProcedureSpec{
			bounds: bounds,
		})
}

// Create a PlanNode with id and mockBoundsShiftProcedureSpec
func makeShiftNode(id string, duration values.Duration) plan.PlanNode {
	return plan.CreateLogicalNode(plan.NodeID(id),
		&mockBoundsShiftProcedureSpec{
			by: duration,
		})
}

func bounds(start, stop int) *plan.Bounds {
	return &plan.Bounds{
		Start: values.Time(start),
		Stop:  values.Time(stop),
	}
}

// Test that bounds are propagated up through the plan correctly
func TestBounds_ComputePlanBounds(t *testing.T) {
	tests := []struct {
		// Name of test
		name string
		// Nodes and edges defining plan
		spec *plantest.PlanSpec
		// Map from node ID to the expected bounds for that node
		want map[plan.NodeID]*plan.Bounds
	}{
		{
			name: "no bounds",
			spec: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plantest.CreatePhysicalMockNode("0"),
				},
			},
			want: map[plan.NodeID]*plan.Bounds{
				"0": nil,
			},
		},
		{
			name: "single time bounds",
			// 0 -> 1 -> 2 -> 3 -> 4
			spec: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plantest.CreatePhysicalMockNode("0"),
					plantest.CreatePhysicalMockNode("1"),
					makeBoundsNode("2", bounds(5, 10)),
					plantest.CreatePhysicalMockNode("3"),
					plantest.CreatePhysicalMockNode("4"),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
					{2, 3},
					{3, 4},
				},
			},
			want: map[plan.NodeID]*plan.Bounds{
				"0": nil,
				"1": nil,
				"2": bounds(5, 10),
				"3": bounds(5, 10),
				"4": bounds(5, 10)},
		},
		{
			name: "multiple intersect time bounds",
			// 0 -> 1 -> 2 -> 3 -> 4
			spec: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plantest.CreatePhysicalMockNode("0"),
					makeBoundsNode("1", bounds(5, 10)),
					plantest.CreatePhysicalMockNode("2"),
					makeBoundsNode("3", bounds(7, 11)),
					plantest.CreatePhysicalMockNode("4"),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
					{2, 3},
					{3, 4},
				},
			},
			want: map[plan.NodeID]*plan.Bounds{
				"0": nil,
				"1": bounds(5, 10),
				"2": bounds(5, 10),
				"3": bounds(7, 10),
				"4": bounds(7, 10)},
		},
		{
			name: "shift nil time bounds",
			// 0 -> 1 -> 2
			spec: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plantest.CreatePhysicalMockNode("0"),
					makeShiftNode("1", values.Duration(5)),
					plantest.CreatePhysicalMockNode("2"),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
				},
			},
			want: map[plan.NodeID]*plan.Bounds{
				"0": nil,
				"1": nil,
				"2": nil,
			},
		},
		{
			name: "shift bounds after intersecting bounds",
			// 0 -> 1 -> 2 -> 3 -> 4
			spec: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plantest.CreatePhysicalMockNode("0"),
					makeBoundsNode("1", bounds(5, 10)),
					plantest.CreatePhysicalMockNode("2"),
					makeShiftNode("3", values.Duration(5)),
					plantest.CreatePhysicalMockNode("4"),
				},
				Edges: [][2]int{
					{0, 1},
					{1, 2},
					{2, 3},
					{3, 4},
				},
			},
			want: map[plan.NodeID]*plan.Bounds{
				"0": nil,
				"1": bounds(5, 10),
				"2": bounds(5, 10),
				"3": bounds(10, 15),
				"4": bounds(10, 15)},
		},
		{
			name: "join",
			//   2
			//  / \
			// 0   1
			spec: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					makeBoundsNode("0", bounds(5, 10)),
					makeBoundsNode("1", bounds(12, 20)),
					plantest.CreatePhysicalMockNode("2"),
				},
				Edges: [][2]int{
					{0, 2},
					{1, 2},
				},
			},
			want: map[plan.NodeID]*plan.Bounds{
				"0": bounds(5, 10),
				"1": bounds(12, 20),
				"2": bounds(5, 20),
			},
		},
		{
			name: "yields",
			// 3   4
			//  \ /
			//   1   2
			//    \ /
			//     0
			spec: &plantest.PlanSpec{
				Nodes: []plan.PlanNode{
					plantest.CreatePhysicalMockNode("0"),
					makeBoundsNode("1", bounds(5, 10)),
					plantest.CreatePhysicalMockNode("2"),
					plantest.CreatePhysicalMockNode("3"),
					plantest.CreatePhysicalMockNode("4"),
				},
				Edges: [][2]int{
					{0, 1},
					{0, 2},
					{1, 3},
					{1, 4},
				},
			},
			want: map[plan.NodeID]*plan.Bounds{
				"0": nil,
				"1": bounds(5, 10),
				"2": nil,
				"3": bounds(5, 10),
				"4": bounds(5, 10),
			},
		},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			// Create plan from spec
			thePlan := plantest.CreatePlanSpec(tc.spec)

			// Method used to compute the bounds at each node
			if err := thePlan.BottomUpWalk(plan.ComputeBounds); err != nil {
				t.Fatal(err)
			}

			// Map NodeID -> Bounds
			got := make(map[plan.NodeID]*plan.Bounds)
			thePlan.BottomUpWalk(func(n plan.PlanNode) error {
				got[n.ID()] = n.Bounds()
				return nil
			})

			if !cmp.Equal(tc.want, got) {
				t.Errorf("Did not get expected time bounds, -want/+got:\n%v", cmp.Diff(tc.want, got))
			}
		})
	}
}
