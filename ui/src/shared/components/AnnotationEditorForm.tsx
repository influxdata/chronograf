import React, {PureComponent, ChangeEvent} from 'react'
import uuid from 'uuid'
import moment from 'moment'

import {Radio, ButtonShape} from 'src/reusable_ui'
import ConfirmButton from 'src/shared/components/ConfirmButton'
import AnnotationTagEditorLi from 'src/shared/components/AnnotationTagEditorLi'

import DefaultDebouncer, {Debouncer} from 'src/shared/utils/debouncer'
import {BLACKLISTED_KEYS} from 'src/shared/annotations/helpers'

import {Annotation} from 'src/types/annotations'

const INPUT_DEBOUNCE_TIME = 600
const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss.SS'
const BAD_DATETIME_ERROR = 'Not a valid date'
const END_BEFORE_START_ERROR = 'End date must be after start date'
const EMPTY_TEXT_ERROR = 'Name cannot be empty'
const DUPLICATE_KEY_ERROR = 'Tag keys must be unique'

const getTime = (d: string | number): number => new Date(d).getTime()
const isValidDate = (d: string | number): boolean => !isNaN(getTime(d))
const formatDate = (d: string | number): string =>
  moment(d).format(DATETIME_FORMAT)

type Type = 'point' | 'window'

interface Props {
  annotation: Annotation
  onSetDraftAnnotation: (draft: Annotation) => void
  onDelete: () => Promise<void>
  debouncer?: Debouncer
}

interface State {
  type: Type
  text: string
  startTime: number
  endTime: number
  tags: Array<{
    id: string
    tagKey: string
    tagValue: string
    shouldAutoFocus: boolean
  }>
  startTimeInput: string
  endTimeInput: string
  textError: string | null
  startTimeError: string | null
  endTimeError: string | null
  tagsError: string | null
}

class AnnotationEditorForm extends PureComponent<Props, State> {
  private debouncer: Debouncer

  constructor(props: Props) {
    super(props)

    this.debouncer = props.debouncer || new DefaultDebouncer()

    const {text, startTime, endTime} = props.annotation
    const type = startTime === endTime ? 'point' : 'window'

    const tags = Object.entries(props.annotation.tags || {}).map(([k, v]) => ({
      id: uuid.v4(),
      tagKey: k,
      tagValue: v,
      shouldAutoFocus: false,
    }))

    this.state = {
      text,
      startTime: getTime(formatDate(startTime)),
      endTime: getTime(formatDate(endTime)),
      tags,
      type,
      startTimeInput: formatDate(startTime),
      startTimeError: null,
      endTimeInput: formatDate(endTime),
      endTimeError: null,
      textError: null,
      tagsError: null,
    }
  }

  public componentWillUnmount() {
    this.debouncer.cancelAll()
  }

  public render() {
    const {onDelete} = this.props
    const {
      type,
      text,
      startTimeInput,
      endTimeInput,
      textError,
      startTimeError,
      endTimeError,
      tagsError,
    } = this.state

    return (
      <div className="annotation-editor-body">
        <div className="row">
          <div className="form-group col-xs-6" data-test="name-group">
            <label>
              Name
              {textError && <div className="error">{textError}</div>}
            </label>
            <input
              type="text"
              className="form-control input-sm"
              value={text}
              onChange={this.handleTextChange}
            />
          </div>
          <div className="form-group col-xs-6" data-test="type-group">
            <label>Type</label>
            <Radio shape={ButtonShape.StretchToFit}>
              <Radio.Button
                id="annotation-editor-type--point"
                value="point"
                active={type === 'point'}
                titleText="Assign a single timestamp to the Annotation"
                onClick={this.handleTypeChange}
              >
                Point
              </Radio.Button>
              <Radio.Button
                id="annotation-editor-type--window"
                value="window"
                active={type === 'window'}
                titleText="Assign a timestamp window to the Annotation"
                onClick={this.handleTypeChange}
              >
                Window
              </Radio.Button>
            </Radio>
          </div>
        </div>
        <div className="row">
          <div
            className={`form-group col-xs-${type === 'point' ? 12 : 6}`}
            data-test="time-group"
          >
            <label>
              {type === 'point' ? 'Time' : 'Start'}
              {startTimeError && <div className="error">{startTimeError}</div>}
            </label>
            <input
              type="text"
              className="form-control input-sm"
              value={startTimeInput}
              onChange={this.handleStartTimeInputChange}
              onBlur={this.handleStartTimeInputBlur}
            />
          </div>
          {type === 'window' && (
            <div className="form-group col-xs-6">
              <label>
                End
                {endTimeError && <div className="error">{endTimeError}</div>}
              </label>
              <input
                type="text"
                className="form-control input-sm"
                value={endTimeInput}
                onChange={this.handleEndTimeInputChange}
                onBlur={this.handleEndTimeInputBlur}
              />
            </div>
          )}
        </div>
        <div className="row">
          <div className="form-group col-xs-12" data-test="tags-group">
            <label>
              Annotation Tags{' '}
              {tagsError && <div className="error">{tagsError}</div>}
            </label>
            <div className="annotation-tag-editor">
              {this.tagEditorListItems}
              <button
                className="btn btn-sm btn-primary annotation-tag-editor--add"
                onClick={this.handleAddTag}
              >
                <span className="icon plus" /> Add Tag
              </button>
            </div>
          </div>
        </div>
        <div className="row">
          <ConfirmButton
            text={'Delete'}
            confirmAction={onDelete}
            type="btn-danger"
            customClass={'annotation-editor-body--delete'}
            size="btn-xs"
          />
        </div>
      </div>
    )
  }

  private get tagEditorListItems(): JSX.Element[] {
    const {tags} = this.state

    return tags.map(({id, tagKey, tagValue, shouldAutoFocus}) => (
      <AnnotationTagEditorLi
        key={id}
        tagKey={tagKey}
        tagValue={tagValue}
        onUpdate={this.handleUpdateTag(id)}
        onDelete={this.handleDeleteTag(id)}
        onKeyDown={this.onKeyDown}
        shouldAutoFocus={shouldAutoFocus}
      />
    ))
  }

  private onKeyDown = (e: string): void => {
    switch (e) {
      case 'Enter':
        this.handleAddTag()
        return
    }
  }

  private handleTextChange = ({
    target: {value: text},
  }: ChangeEvent<HTMLInputElement>): void => {
    let nextState: Pick<State, 'text' | 'textError'> = {text, textError: null}

    if (!text) {
      nextState = {text, textError: EMPTY_TEXT_ERROR}
    }

    this.setState(nextState, () => this.setDraftAnnotation())
  }

  private handleTypeChange = (type: Type): void => {
    if (type === 'point') {
      this.setState({type}, () => this.setDraftAnnotation())
    } else if (type === 'window') {
      const endTime = getTime(this.props.annotation.endTime)

      this.setState(
        {
          type,
          endTimeInput: formatDate(endTime),
          endTimeError: null,
        },
        () => this.changeEndTime()
      )
    }
  }

  private handleStartTimeInputChange = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    this.setState(
      {
        startTimeInput: e.target.value,
        startTimeError: null,
      },
      () => {
        this.debouncer.call(this.changeStartTime, INPUT_DEBOUNCE_TIME)
      }
    )
  }

  private handleStartTimeInputBlur = (): void => {
    const {startTimeInput} = this.state

    if (isValidDate(startTimeInput)) {
      this.setState({startTimeInput: formatDate(getTime(startTimeInput))})
    }
  }

  private changeStartTime = () => {
    const {startTimeInput} = this.state

    // eslint-disable-next-line @typescript-eslint/ban-types
    let nextState: object = {
      startTime: getTime(startTimeInput),
      startTimeError: null,
    }

    if (!isValidDate(startTimeInput)) {
      nextState = {startTimeError: BAD_DATETIME_ERROR}
    }

    this.setState(nextState, () => this.setDraftAnnotation())
  }

  private handleEndTimeInputChange = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    this.setState(
      {
        endTimeInput: e.target.value,
        endTimeError: null,
      },
      () => {
        this.debouncer.call(this.changeEndTime, INPUT_DEBOUNCE_TIME)
      }
    )
  }

  private handleEndTimeInputBlur = (): void => {
    const {endTimeInput} = this.state

    if (isValidDate(endTimeInput)) {
      this.setState({endTimeInput: formatDate(getTime(endTimeInput))})
    }
  }

  private changeEndTime = () => {
    const {startTime, endTimeInput} = this.state

    // eslint-disable-next-line @typescript-eslint/ban-types
    let nextState: object = {
      endTime: getTime(endTimeInput),
      endTimeError: null,
    }

    if (!isValidDate(endTimeInput)) {
      nextState = {endTimeError: BAD_DATETIME_ERROR}
    } else if (getTime(endTimeInput) < startTime) {
      nextState = {endTimeError: END_BEFORE_START_ERROR}
    }

    this.setState(nextState, () => this.setDraftAnnotation())
  }

  private handleAddTag = (): void => {
    const newTag = {
      id: uuid.v4(),
      tagKey: '',
      tagValue: '',
      shouldAutoFocus: true,
    }

    const oldTags = this.state.tags.map(tag => {
      return {...tag, shouldAutoFocus: false}
    })

    this.setState({tags: [...oldTags, newTag]}, this.setDraftAnnotation)
  }

  private handleUpdateTag = (id: string) => (
    tagKey: string,
    tagValue: string
  ): void => {
    const {tags} = this.state
    const newTag = {id, tagKey, tagValue}
    const i = tags.findIndex(t => t.id === id)
    const newTags = [...tags.slice(0, i), newTag, ...tags.slice(i + 1)]
    const uniqueKeys = new Set(newTags.map(t => t.tagKey))

    const nextState: any = {tags: newTags}

    if (BLACKLISTED_KEYS.includes(tagKey)) {
      nextState.tagsError = `“${tagKey}” cannot be used as a tag key`
    } else if (uniqueKeys.size < tags.length) {
      nextState.tagsError = DUPLICATE_KEY_ERROR
    } else {
      nextState.tagsError = null
    }

    this.setState(nextState, this.setDraftAnnotation)
  }

  private handleDeleteTag = (id: string) => (): void => {
    const tags = this.state.tags.filter(t => t.id !== id)
    const uniqueKeys = new Set(tags.map(t => t.tagKey))
    const nextState: any = {tags}

    if (uniqueKeys.size < tags.length) {
      nextState.tagsError = DUPLICATE_KEY_ERROR
    } else {
      nextState.tagsError = null
    }

    this.setState(nextState, this.setDraftAnnotation)
  }

  private setDraftAnnotation = (): void => {
    const {annotation, onSetDraftAnnotation} = this.props
    const {
      type,
      startTime,
      endTime,
      text,
      startTimeError,
      endTimeError,
      textError,
      tagsError,
      tags,
    } = this.state

    if (!!startTimeError || !!endTimeError || !!textError || !!tagsError) {
      onSetDraftAnnotation(null)

      return
    }

    const annotationTags = tags.reduce(
      (acc, {tagKey, tagValue}) => ({
        ...acc,
        [tagKey]: tagValue,
      }),
      {}
    )

    delete annotationTags['']

    onSetDraftAnnotation({
      id: annotation.id,
      startTime,
      endTime: type === 'window' ? endTime : startTime,
      text,
      tags: annotationTags,
      links: annotation.links,
    })
  }
}

export default AnnotationEditorForm
