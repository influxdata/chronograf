import AJAX from 'utils/ajax';

export function fetchShardGroups(source) {
  return AJAX({
    url: `/chronograf/v1/sources/${source.id}/shardgroups`,
    method: 'GET',
  });
}
