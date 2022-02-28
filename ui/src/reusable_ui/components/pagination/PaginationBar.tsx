// Libraries
import React from 'react'
import Button from '../Button'

interface Props {
  total: number
  page: number
  onChange: (page: number, pageSize: number) => void
  pageSize?: number
  diameter?: number
}

export default function PaginationBar({
  total,
  page,
  pageSize = 100,
  onChange,
  diameter = 4,
}: Props) {
  const maxPage = Math.trunc((total - 1) / pageSize)
  const radius = Math.trunc(diameter / 2)
  if (page < 0) {
    page = 0
  }
  if (page > maxPage) {
    page = maxPage
  }
  let startPage = Math.max(0, page - radius)
  let endPage = Math.min(page + radius, maxPage)
  // try to show at least 1+BUTTONS_DIAMETER page buttons
  if (endPage - startPage < diameter) {
    startPage = Math.max(startPage - (diameter - endPage + startPage), 0)
  }
  if (endPage - startPage < diameter) {
    endPage = Math.min(endPage + (diameter - endPage + startPage), maxPage)
  }
  const buttons: JSX.Element[] = new Array<JSX.Element>(endPage - startPage + 1)
  for (let i = startPage; i <= endPage; i++) {
    buttons[i] = (
      <Button
        key={`page-${i}`}
        active={page === i}
        onClick={() => onChange(i, pageSize)}
        text={String(i + 1)}
      />
    )
  }
  return (
    <div style={{display: 'inline-flex', alignItems: 'baseline', gap: '10px'}}>
      <button
        className="btn btn-sm btn-default"
        disabled={page === 0}
        onClick={() => onChange(Math.max(0, page - 1), pageSize)}
        style={{minWidth: '70px'}}
        title="Previous Page"
      >
        <span className="icon caret-left" /> Prev
      </button>
      {startPage !== 0 ? (
        <Button key="page-0" onClick={() => onChange(0, pageSize)} text="1" />
      ) : undefined}
      {startPage > 1 ? (
        <span style={{margin: '0px 10px'}}>...</span>
      ) : undefined}
      {buttons}
      {endPage < maxPage - 1 ? (
        <span style={{margin: '0px 10px'}}>...</span>
      ) : undefined}
      {endPage !== maxPage ? (
        <Button
          key={`page-${maxPage}`}
          onClick={() => onChange(maxPage, pageSize)}
          text={String(maxPage + 1)}
        />
      ) : undefined}
      <button
        className="btn btn-sm btn-default"
        disabled={page === maxPage}
        onClick={() => onChange(Math.min(page + 1, maxPage), pageSize)}
        style={{minWidth: '70px'}}
        title="Next Page"
      >
        Next <span className="icon caret-right" />
      </button>
    </div>
  )
}
