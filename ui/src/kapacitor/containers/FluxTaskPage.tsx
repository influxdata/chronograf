import React, {FC, useEffect, useState} from 'react'
import {Page} from 'src/reusable_ui'

import {getActiveKapacitor, getKapacitor} from 'src/shared/apis'

import {Source, Kapacitor, FluxTask} from 'src/types'
import {getFluxTask} from '../apis'

interface Params {
  taskID: string
  kid?: string // kapacitor id
}

interface Props {
  source: Source
  params: Params
  router: {
    push: (path: string) => void
  }
}

const FluxTaskPage: FC<Props> = ({source, params: {taskID, kid}, router}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(undefined)
  const [task, setTask] = useState<FluxTask | undefined>(undefined)
  useEffect(() => {
    setLoading(true)
    const fetchDevices = async () => {
      try {
        let kapa: Kapacitor
        if (kid) {
          kapa = await getActiveKapacitor(source)
        } else {
          kapa = await getKapacitor(source, kid)
        }
        if (!kapa) {
          setError(new Error('Kapacitor not found!'))
          return
        }
        const taskVal = await getFluxTask(kapa, taskID)
        if (!taskVal) {
          setError(new Error(`Task identified by ${taskID} not found!`))
          return
        }
        setTask(taskVal)
      } catch (e) {
        console.error(e)
        setError(
          new Error(
            e?.data?.message ? e.data.message : `Cannot load flux task: ${e}`
          )
        )
      } finally {
        setLoading(false)
      }
    }
    fetchDevices()
  }, [kid, taskID])

  let contents = null
  if (error) {
    contents = <p className="unexpected_error">{error.toString()}</p>
  } else if (loading) {
    // TODO render loading
    contents = <div>{loading}</div>
  } else if (task) {
    // TODO render task
    contents = (
      <div>
        <textarea defaultValue={task.flux}></textarea>
      </div>
    )
  }

  return (
    <Page>
      <Page.Header>
        <Page.Header.Left>
          <Page.Title title="Flux Task" />
        </Page.Header.Left>
        <Page.Header.Right showSourceIndicator={true}>
          <button
            className="btn btn-default btn-sm"
            title="Return to Tasks"
            onClick={() => {
              router.push(`/sources/${source.id}/alert-rules`)
            }}
          >
            Exit
          </button>
        </Page.Header.Right>
      </Page.Header>
      <Page.Contents>{contents}</Page.Contents>
    </Page>
  )
}

export default FluxTaskPage
