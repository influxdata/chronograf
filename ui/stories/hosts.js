import React from 'react';
import {storiesOf, action, linkTo} from '@kadira/storybook';

import autoflowLayouts from './stubs/autoflowLayouts';
import source from './stubs/source';
import {spyActions} from './shared';

// Components
import HostPage from 'src/hosts/containers/HostPage'

const hostPageComponent = (autoflowCase, hostID = "acc-fa5bda57-us-west-2-meta-0", sourceID = "1") => (
  <div className="chronograf-root">
    <HostPage
      location={{
        query: {},
      }}
      params={{
        hostID,
        sourceID,
      }}
      source={source()}
      autoflowLayoutsStub={autoflowLayouts(autoflowCase)}
    />
  </div>
);

storiesOf('HostPage', module)
  .add('3x3', () => hostPageComponent('3x3'))
  .add('garbage', () => hostPageComponent('garbage'))
  .add('stub2', () => hostPageComponent('stub2', 'test', '5'))
