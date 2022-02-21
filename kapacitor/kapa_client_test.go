package kapacitor_test

import (
	"fmt"
	"testing"

	"github.com/influxdata/chronograf/kapacitor"
	"github.com/influxdata/chronograf/mocks"
	client "github.com/influxdata/kapacitor/client/v1"
)

func Test_Kapacitor_PaginatingKapaClient(t *testing.T) {
	const lenAllTasks = 227 // prime, to stress odd result sets

	// create a mock client that will return a huge response from ListTasks
	mockClient := &mocks.KapaClient{
		ListTasksF: func(opts *client.ListTasksOptions) ([]client.Task, error) {
			// create all the tasks
			allTasks := []client.Task{}
			for i := 0; i < lenAllTasks; i++ {
				allTasks = append(allTasks, client.Task{
					ID: "id" + fmt.Sprintf("%3d", i),
				})
			}
			begin := opts.Offset
			end := opts.Offset + opts.Limit

			if end > len(allTasks) {
				end = len(allTasks)
			}

			if begin > len(allTasks) {
				begin = end
			}

			return allTasks[begin:end], nil
		},
	}

	pkap := kapacitor.PaginatingKapaClient{
		KapaClient: mockClient,
		FetchRate:  50,
	}

	t.Run("100 tasks returned when calling with limit", func(t *testing.T) {
		opts := &client.ListTasksOptions{
			Limit:  100,
			Offset: 0,
		}
		// ensure 100 elems returned when calling mockClient directly
		tasks, _ := pkap.ListTasks(opts)

		if len(tasks) != 100 {
			t.Error("Expected calling KapaClient's ListTasks to return", opts.Limit, "items. Received:", len(tasks))
		}
	})

	t.Run("all tasks with 0 Limit", func(t *testing.T) {
		opts := &client.ListTasksOptions{
			Limit:  0,
			Offset: 0,
		}
		tasks, _ := pkap.ListTasks(opts)
		if len(tasks) != lenAllTasks {
			t.Error("PaginatingKapaClient: Expected to find", lenAllTasks, "tasks but found", len(tasks))
		}
		opts.Offset = 100
		tasks, _ = pkap.ListTasks(opts)
		if len(tasks) != lenAllTasks-100 {
			t.Error("PaginatingKapaClient: Expected to find", lenAllTasks-100, "tasks but found", len(tasks))
		}
	})

	t.Run("tasks matching pattern", func(t *testing.T) {
		opts := &client.ListTasksOptions{
			Pattern: " ",
		}
		tasks, _ := pkap.ListTasks(opts)
		if len(tasks) != 100 {
			t.Error("PaginatingKapaClient: Expected to find 100 tasks but found", len(tasks))
		}
		opts = &client.ListTasksOptions{
			Pattern: " ",
			Limit:   20,
		}
		tasks, _ = pkap.ListTasks(opts)
		if len(tasks) != 20 {
			t.Error("PaginatingKapaClient: Expected to find 100 tasks but found", len(tasks))
		}

		opts = &client.ListTasksOptions{
			Pattern: "id22",
			Limit:   10,
		}
		tasks, _ = pkap.ListTasks(opts)
		if len(tasks) != 7 {
			t.Error("PaginatingKapaClient: Expected to find 7 matching task but found: ", len(tasks))
		}
		opts = &client.ListTasksOptions{
			Pattern: "id22",
			Limit:   1,
		}
		tasks, _ = pkap.ListTasks(opts)
		if len(tasks) != 1 {
			t.Error("PaginatingKapaClient: Expected to find 1 matching task but found: ", len(tasks))
		}
		opts = &client.ListTasksOptions{
			Pattern: "id227",
		}
		tasks, _ = pkap.ListTasks(opts)
		if len(tasks) != 0 {
			t.Error("PaginatingKapaClient: Expected to find no matching task but found: ", len(tasks))
		}
	})
	t.Run("zero offset required with pattern specified", func(t *testing.T) {
		opts := &client.ListTasksOptions{
			Pattern: " ",
			Offset:  1,
		}
		_, err := pkap.ListTasks(opts)
		if err == nil {
			t.Error("PaginatingKapaClient: Error expected but no error returned")
		}
	})

}
