interface Authors {
  name: string
}

interface JSONFeedDataItem {
  id: string
  url: string
  title: string
  content_text: string
  date_published: string
  date_modified: string
  image: string
  authors: Authors[]
}

export interface JSONFeedData {
  version: string
  user_comment: string
  home_page_url: string
  feed_url: string
  title: string
  description: string
  items: JSONFeedDataItem[]
}
