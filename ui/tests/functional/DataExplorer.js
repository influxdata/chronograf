define(
  [
    'intern!object',
    'intern/chai!assert',
    'require',
    'intern/lib/parseArgs',
    // 'intern/dojo/node!fs',
  ],
  (registerSuite, assert, require, parseArgs) => {
    const {src} = parseArgs.fromCommandLine()
    if (!src) {
      console.error('no src provided')
    }

    const url = `http://localhost:8888/sources/${src}/chronograf/data-explorer`

    registerSuite({
      name: 'Data Explorer (functional)',

      'SHOW DATABASES'() {
        return this.remote
          .get(require.toUrl(url))
          .sleep(500)
          .findByXpath(
            '//div[@class="btn btn-primary"][contains(.,"Add a Query")]'
          )
          .click()
          .end()
          .sleep(500)
          .findByCssSelector('textarea.query-editor--field')
          .click()
          .type('SHOW DATABASES\n')
          .end()
          .sleep(2500)
          .findByCssSelector('div.table--tabs-content')
          .getProperty('innerText')
          .then(val => {
            assert.ok(
              val.includes('_internal'),
              'SHOW DATABASES should list the _internal database'
            )
          })
          .end()
      },
      'Query Builder'() {
        return (
          this.remote
            .get(require.toUrl(url))
            .sleep(1000)
            .findByCssSelector('div.query-maker--new')
            .click()
            .end()
            .sleep(1000)
            // .findByCssSelector('.query-builder--column:nth-child(1)')
            .findByXpath(
              '//div[@class="query-builder--column query-builder--column-db"]//div[@class="query-builder--list-item"][contains(.,"_internal.monitor")]'
            )
            .click()
            .end()
            .sleep(1000)
            // .findByCssSelector('.query-builder--column:nth-child(2)')
            // .findByXpath('//div[contains(.,"database")]')
            .findByXpath(
              '//div[@class="query-builder--column"][position()=1]//div[@class="query-builder--list-item"][contains(.,"database")]'
            )
            .click()
            .end()
            .sleep(1000)
            .findByXpath(
              '//div[@class="query-builder--column"][position()=1]//div[@class="query-builder--list-item"][contains(.,"database — ")]'
            )
            .click()
            .end()
            .sleep(1000)
            .findByCssSelector('input[placeholder="Filter within database"]')
            .type('intern')
            .end()
            .findByCssSelector('.query-builder--checkbox')
            .click()
            .end()
            .sleep(1000)
            .findByXpath(
              '//div[@class="query-builder--list-item"][contains(.,"numMeasurements")]'
            )
            .click()
            .end()
            .findByCssSelector('.graph-heading li:nth-child(2)')
            .click()
            .end()
            .findByCssSelector(
              '.fixedDataTableRowLayout_rowWrapper:nth-child(3) .public_fixedDataTableCell_main:nth-child(2)'
            )
            .getProperty('innerText')
            .then(val => {
              assert.ok(
                val.includes('12'),
                'mean number of measurements says 12 on Hunters machine'
              )
            })
            .end()
        )

        // .findById('new-todo')
        // .click()
        // .pressKeys('Task 1')
        // .pressKeys('\n')
        // .pressKeys('Task 2')
        // .pressKeys('\n')
        // .pressKeys('Task 3')
        // .getProperty('value')
        // .then(function(val) {
        //   assert.ok(
        //     val.indexOf('Task 3') > -1,
        //     'Task 3 should remain in the new todo'
        //   )
        // })
      },
    })
  }
)
