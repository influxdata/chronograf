package plan

type Statistics struct {
	Cardinality      int64
	GroupCardinality int64
}

// Cost stores various dimensions of the cost of a query plan
type Cost struct {
	Disk int64
	CPU  int64
	GPU  int64
	MEM  int64
	NET  int64
}

// Add two cost structures together
func Add(a Cost, b Cost) Cost {
	return Cost{
		Disk: a.Disk + b.Disk,
		CPU:  a.CPU + b.CPU,
		GPU:  a.GPU + b.GPU,
		MEM:  a.MEM + b.MEM,
		NET:  a.NET + b.NET,
	}
}

type DefaultCost struct {
}

func (c DefaultCost) Cost(inStats []Statistics) (Cost, Statistics) {
	return Cost{}, Statistics{}
}
