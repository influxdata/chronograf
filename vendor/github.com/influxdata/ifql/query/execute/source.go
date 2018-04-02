package execute

import (
	"context"
	"fmt"
	"log"

	"github.com/influxdata/ifql/query/plan"
	"github.com/opentracing/opentracing-go"
)

type Node interface {
	AddTransformation(t Transformation)
}

type Source interface {
	Node
	Run(ctx context.Context)
}

type CreateSource func(spec plan.ProcedureSpec, id DatasetID, sr StorageReader, ctx Administration) Source

var procedureToSource = make(map[plan.ProcedureKind]CreateSource)

func RegisterSource(k plan.ProcedureKind, c CreateSource) {
	if procedureToSource[k] != nil {
		panic(fmt.Errorf("duplicate registration for source with procedure kind %v", k))
	}
	procedureToSource[k] = c
}

// storageSource performs storage reads
type storageSource struct {
	id       DatasetID
	reader   StorageReader
	readSpec ReadSpec
	window   Window
	bounds   Bounds

	ts []Transformation

	currentTime Time
}

func NewStorageSource(id DatasetID, r StorageReader, readSpec ReadSpec, bounds Bounds, w Window, currentTime Time) Source {
	return &storageSource{
		id:          id,
		reader:      r,
		readSpec:    readSpec,
		bounds:      bounds,
		window:      w,
		currentTime: currentTime,
	}
}

func (s *storageSource) AddTransformation(t Transformation) {
	s.ts = append(s.ts, t)
}

func (s *storageSource) Run(ctx context.Context) {
	err := s.run(ctx)
	for _, t := range s.ts {
		t.Finish(s.id, err)
	}
}
func (s *storageSource) run(ctx context.Context) error {

	var trace map[string]string
	if span := opentracing.SpanFromContext(ctx); span != nil {
		trace = make(map[string]string)
		span = opentracing.StartSpan("storage_source.run", opentracing.ChildOf(span.Context()))
		_ = opentracing.GlobalTracer().Inject(span.Context(), opentracing.TextMap, opentracing.TextMapCarrier(trace))
	}

	//TODO(nathanielc): Pass through context to actual network I/O.
	for blocks, mark, ok := s.Next(ctx, trace); ok; blocks, mark, ok = s.Next(ctx, trace) {
		err := blocks.Do(func(b Block) error {
			for _, t := range s.ts {
				if err := t.Process(s.id, b); err != nil {
					return err
				}
				//TODO(nathanielc): Also add mechanism to send UpdateProcessingTime calls, when no data is arriving.
				// This is probably not needed for this source, but other sources should do so.
				if err := t.UpdateProcessingTime(s.id, Now()); err != nil {
					return err
				}
			}
			return nil
		})
		if err != nil {
			return err
		}
		for _, t := range s.ts {
			if err := t.UpdateWatermark(s.id, mark); err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *storageSource) Next(ctx context.Context, trace map[string]string) (BlockIterator, Time, bool) {
	start := s.currentTime - Time(s.window.Period)
	stop := s.currentTime

	s.currentTime = s.currentTime + Time(s.window.Every)
	if stop > s.bounds.Stop {
		return nil, 0, false
	}
	bi, err := s.reader.Read(
		ctx,
		trace,
		s.readSpec,
		start,
		stop,
	)
	if err != nil {
		log.Println("E!", err)
		return nil, 0, false
	}
	return bi, stop, true
}
