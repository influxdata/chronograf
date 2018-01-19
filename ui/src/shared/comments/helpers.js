export const getComments = (graph, comments = []) => {
  if (!graph) {
    return []
  }

  const [xStart, xEnd] = graph.xAxisRange()
  return comments.reduce((acc, a) => {
    // Don't render if comment.time is outside the graph
    const time = +a.time
    const duration = +a.duration
    const endTime = time + duration
    const endComment = {
      ...a,
      id: `${a.id}-end`,
      time: `${endTime}`,
      duration: '',
    }

    if (time < xStart) {
      if (endTime > xStart) {
        return [...acc, a, endComment]
      }

      return acc
    }

    if (time > xEnd) {
      return acc
    }

    // If comment does not have duration, include in array
    if (!duration) {
      return [...acc, a]
    }

    // If endTime is out of bounds, just render the start point
    if (endTime > xEnd) {
      return [...acc, a]
    }

    // Render both the start and end point
    return [...acc, a, endComment]
  }, [])
}
