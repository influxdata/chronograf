// Libraries
import React from 'react'
import Button from '../Button'

interface Props {
  total: number
  page: number
  onChange: (page: number, pageSize: number) => void
  pageSize?: number
}

export default function PaginationBar({
  total,
  page,
  pageSize = 100,
  onChange,
}: Props) {
  const maxPage = Math.trunc((total - 1) / pageSize)
  if (page < 0) {
    page = 0
  }
  if (page > maxPage) {
    page = maxPage
  }
  let startPage = Math.max(0, page - 2)
  let endPage = Math.min(page + 2, maxPage)
  // try to show at least 5 page buttons
  if (endPage - startPage < 4) {
    startPage = Math.max(startPage - (4 - endPage + startPage), 0)
  }
  if (endPage - startPage < 4) {
    endPage = Math.min(endPage + (4 - endPage + startPage), maxPage)
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
        disabled={page === maxPage}
        onClick={() => onChange(Math.max(0, page - 1), pageSize)}
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
        title="Next Page"
      >
        Next <span className="icon caret-right" />
      </button>
    </div>
  )
}
