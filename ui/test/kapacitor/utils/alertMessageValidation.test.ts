import {
  isValidMessage,
  mismatchedBrackets,
  isValidTemplate,
} from 'src/kapacitor/utils/alertMessageValidation'
import {RULE_MESSAGE_TEMPLATE_TEXTS} from 'src/kapacitor/constants'

// for a full list of valid go templates consult: https://golang.org/pkg/text/template/

describe('kapacitor.utils.alertMessageValidation', () => {
  describe('isValidMessage', () => {
    it('accepts message containing a "with" block', () => {
      const template = `{{ with eq.Tags "something" }} alert is under threshold{{ else }} alert is over threshold{{ end }}`

      const isValid = isValidMessage(template)

      expect(isValid).toBe(true)
    })

    it('accepts message containing a "block" block', () => {
      const template = `{{ block eq.Tags "something" }} alert is under threshold{{ else }} alert is over threshold{{ end }}`

      const isValid = isValidMessage(template)

      expect(isValid).toBe(true)
    })

    it('accepts message containing a "range" block', () => {
      const template = `{{ range eq.Tags "something" }} alert is under threshold{{ else }} alert is over threshold{{ end }}`

      const isValid = isValidMessage(template)

      expect(isValid).toBe(true)
    })

    it('accepts message containing an "if" block', () => {
      const template = `{{ if eq.Tags "something" }} alert is under threshold{{ else }} alert is over threshold{{ end }}`

      const isValid = isValidMessage(template)

      expect(isValid).toBe(true)
    })

    it('accepts message containing one simple template', () => {
      const isValid = isValidMessage('{{.ID}}')

      expect(isValid).toEqual(true)
    })

    it('accepts message containing one simple and one complex template', () => {
      const isValid = isValidMessage('{{ index .Tags "something" }}  {{.Name}}')

      expect(isValid).toEqual(true)
    })

    it('accepts message containing templates and strings mixed', () => {
      const isValid = isValidMessage(
        '{{ index .Tags "moo" }} lkajsdflkjasdf  {{.Name}}lksjdflsj'
      )

      expect(isValid).toEqual(true)
    })

    it('rejects message with invalid template', () => {
      const isValid = isValidMessage('{{ I am invalid}}')

      expect(isValid).toEqual(false)
    })

    it('rejects message containing template with missing closing bracket', () => {
      const isValid = isValidMessage('{{ index .Tags "value" } {{.Name}}')

      expect(isValid).toEqual(false)
    })

    it('rejects message containing non-matching brackets', () => {
      const isValid = isValidMessage('{{ index .Tags "value"  {{.Name}}')

      expect(isValid).toEqual(false)
    })
  })

  describe('mismatchedBrackets', () => {
    it('String containing matched brackets is not mismatched', () => {
      const isMismatched = mismatchedBrackets('{{}}')

      expect(isMismatched).toEqual(false)
    })
    it('String containing matched brackets and other characters is not mismatched', () => {
      const isMismatched = mismatchedBrackets('asdf{{asdfaasdas}}asdfa')

      expect(isMismatched).toEqual(false)
    })
    it('String containing unmatched brackets is mismatched', () => {
      const isMismatched = mismatchedBrackets('{{}')

      expect(isMismatched).toEqual(true)
    })
    it('String containing unmatched brackets and other characters is mismatched', () => {
      const isMismatched = mismatchedBrackets('asdf{{as}asdfa)')

      expect(isMismatched).toEqual(true)
    })
  })

  describe('isValidTemplate', () => {
    it('is True for an exact match to a valid template', () => {
      const isValid = isValidTemplate(RULE_MESSAGE_TEMPLATE_TEXTS[0])

      expect(isValid).toEqual(true)
    })

    it('is False for a jibberish input', () => {
      const isValid = isValidTemplate('laslkj;owaiu0294u,mxn')

      expect(isValid).toEqual(false)
    })

    it('is True for a fuzzy match to tags', () => {
      const isValid = isValidTemplate('(index .Tags "lalala")')

      expect(isValid).toEqual(true)
    })

    it('is False for distorted version of tags', () => {
      const isValid = isValidTemplate('(indeasdfx .Tags "lalala")')

      expect(isValid).toEqual(false)
    })
  })
})
