import {clone} from 'fast.js';

const stub = [
  {
    "id": "0fa47984-825b-46f1-9ca5-0366e3281cc5",
    "app": "system",
    "measurement": "cpu",
    "autoflow": true,
    "cells": [
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "cc9ba2b6-e398-4396-80dc-819bb7ac7ce1",
        "name": "CPU Usage",
        "queries": [
          {
            "query": "SELECT mean(\"usage_user\") AS \"usage_user\" FROM \"cpu\""
          }
        ],
        "type": ""
      }
    ],
    "link": {
      "href": "/chronograf/v1/layouts/0fa47984-825b-46f1-9ca5-0366e3281cc5",
      "rel": "self"
    }
  },
  {
    "id": "0b75be4e-3454-4d5d-9a98-ca77c81397f6",
    "app": "system",
    "measurement": "disk",
    "autoflow": true,
    "cells": [
      {
        "x": 4,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "5825a4dd-df97-4e99-a99d-67b68833c183",
        "name": "System - Disk used %",
        "queries": [
          {
            "query": "SELECT mean(\"used_percent\") AS \"used_percent\" FROM disk",
            "groupbys": [
              "\"path\""
            ]
          }
        ],
        "type": ""
      }
    ],
    "link": {
      "href": "/chronograf/v1/layouts/0b75be4e-3454-4d5d-9a98-ca77c81397f6",
      "rel": "self"
    }
  },
  {
    "id": "9e3a9fcd-a363-4470-991e-a4d6987a94c8",
    "app": "system",
    "measurement": "diskio",
    "autoflow": true,
    "cells": [
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "7f647740-d9f0-4012-8e7a-5d898c8f271e",
        "name": "System – Disk MB/s",
        "queries": [
          {
            "query": "SELECT non_negative_derivative(max(\"read_bytes\"), 1s) / 1000000 AS \"read_megabytes_per_second\" FROM diskio",
            "groupbys": [
              "\"name\""
            ],
            "label": "MB/s"
          },
          {
            "query": "SELECT non_negative_derivative(max(\"write_bytes\"), 1s) / 1000000 AS \"write_megabytes_per_second\" FROM diskio",
            "groupbys": [
              "\"name\""
            ]
          }
        ],
        "type": ""
      }
    ],
    "link": {
      "href": "/chronograf/v1/layouts/9e3a9fcd-a363-4470-991e-a4d6987a94c8",
      "rel": "self"
    }
  },
  {
    "id": "0e980b97-c162-487b-a815-3f955df6243f",
    "app": "docker",
    "measurement": "docker",
    "autoflow": true,
    "cells": [
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "4c79cefb-5152-410c-9b88-74f9bff7ef22",
        "name": "Docker - Container CPU",
        "queries": [
          {
            "query": "SELECT mean(\"usage_percent\") AS \"usage_percent\" FROM \"docker_container_cpu\"",
            "groupbys": [
              "\"container_name\""
            ]
          }
        ],
        "type": ""
      },
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "4c79cefb-5152-410c-9b88-74f9bff7ef00",
        "name": "Docker - Container Memory",
        "queries": [
          {
            "query": "SELECT mean(\"usage\") AS \"usage\" FROM \"docker_container_mem\"",
            "groupbys": [
              "\"container_name\""
            ]
          }
        ],
        "type": ""
      }
    ],
    "link": {
      "href": "/chronograf/v1/layouts/0e980b97-c162-487b-a815-3f955df6243f",
      "rel": "self"
    }
  },
  {
    "id": "ec6c48f4-48ca-4ba7-a842-5b700e19f274",
    "app": "system",
    "measurement": "system",
    "autoflow": true,
    "cells": [
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "6ec7e632-2c19-475c-8747-56feaacf46ce",
        "name": "System Load",
        "queries": [
          {
            "query": "SELECT mean(\"load1\") AS \"load\" FROM \"system\""
          }
        ],
        "type": ""
      }
    ],
    "link": {
      "href": "/chronograf/v1/layouts/ec6c48f4-48ca-4ba7-a842-5b700e19f274",
      "rel": "self"
    }
  },
  {
    "id": "4a805493-f7ef-4da0-8de8-e78afd899722",
    "app": "system",
    "measurement": "mem",
    "autoflow": true,
    "cells": [
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "e6e5063c-43d5-409b-a0ab-68da51ed3f28",
        "name": "System - Memory Bytes Used",
        "queries": [
          {
            "query": "SELECT mean(\"used\") AS \"used\", mean(\"available\") AS \"available\" FROM \"mem\""
          }
        ],
        "type": ""
      }
    ],
    "link": {
      "href": "/chronograf/v1/layouts/4a805493-f7ef-4da0-8de8-e78afd899722",
      "rel": "self"
    }
  },
  {
    "id": "ff41d044-f61a-4522-8de7-9e39e3a1b5de",
    "app": "system",
    "measurement": "netstat",
    "autoflow": true,
    "cells": [
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "cf5d0608-b513-4244-a55f-accf520da3a1",
        "name": "System - Open Sockets",
        "queries": [
          {
            "query": "SELECT mean(\"tcp_established\") AS \"tcp_established\" FROM netstat"
          },
          {
            "query": "SELECT mean(\"udp_socket\") AS \"udp_socket\" FROM netstat"
          }
        ],
        "type": ""
      },
      {
        "x": 4,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "63503235-a588-49a7-ae0a-fb015c888e5b",
        "name": "System - Sockets Created/Second ",
        "queries": [
          {
            "query": "SELECT non_negative_derivative(max(\"tcp_established\")) AS \"tcp_established\" FROM netstat"
          },
          {
            "query": "SELECT non_negative_derivative(max(\"udp_socket\")) AS \"udp_socket\" FROM netstat"
          }
        ],
        "type": ""
      }
    ],
    "link": {
      "href": "/chronograf/v1/layouts/ff41d044-f61a-4522-8de7-9e39e3a1b5de",
      "rel": "self"
    }
  }
];





const stub2 = [
  {
    "id": "0fa47984-825b-46f1-9ca5-0366e3281cc5",
    "app": "system",
    "measurement": "cpu",
    "autoflow": true,
    "cells": [
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "cc9ba2b6-e398-4396-80dc-819bb7ac7ce1",
        "name": "CPU Usage",
        "queries": [
          {
            "query": "SELECT mean(\"usage_user\") AS \"usage_user\" FROM \"cpu\""
          }
        ],
        "type": ""
      }
    ],
    "link": {
      "href": "/chronograf/v1/layouts/0fa47984-825b-46f1-9ca5-0366e3281cc5",
      "rel": "self"
    }
  },
  {
    "id": "0b75be4e-3454-4d5d-9a98-ca77c81397f6",
    "app": "system",
    "measurement": "disk",
    "autoflow": true,
    "cells": [
      {
        "x": 4,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "5825a4dd-df97-4e99-a99d-67b68833c183",
        "name": "System - Disk used %",
        "queries": [
          {
            "query": "SELECT mean(\"used_percent\") AS \"used_percent\" FROM disk",
            "groupbys": [
              "\"path\""
            ]
          }
        ],
        "type": ""
      }
    ],
    "link": {
      "href": "/chronograf/v1/layouts/0b75be4e-3454-4d5d-9a98-ca77c81397f6",
      "rel": "self"
    }
  },
  {
    "id": "9e3a9fcd-a363-4470-991e-a4d6987a94c8",
    "app": "system",
    "measurement": "diskio",
    "autoflow": true,
    "cells": [
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "7f647740-d9f0-4012-8e7a-5d898c8f271e",
        "name": "System – Disk MB/s",
        "queries": [
          {
            "query": "SELECT non_negative_derivative(max(\"read_bytes\"), 1s) / 1000000 AS \"read_megabytes_per_second\" FROM diskio",
            "groupbys": [
              "\"name\""
            ],
            "label": "MB/s"
          },
          {
            "query": "SELECT non_negative_derivative(max(\"write_bytes\"), 1s) / 1000000 AS \"write_megabytes_per_second\" FROM diskio",
            "groupbys": [
              "\"name\""
            ]
          }
        ],
        "type": ""
      }
    ],
    "link": {
      "href": "/chronograf/v1/layouts/9e3a9fcd-a363-4470-991e-a4d6987a94c8",
      "rel": "self"
    }
  },
  {
    "id": "ec6c48f4-48ca-4ba7-a842-5b700e19f274",
    "app": "system",
    "measurement": "system",
    "autoflow": true,
    "cells": [
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "6ec7e632-2c19-475c-8747-56feaacf46ce",
        "name": "System Load",
        "queries": [
          {
            "query": "SELECT mean(\"load1\") AS \"load\" FROM \"system\""
          }
        ],
        "type": ""
      }
    ],
    "link": {
      "href": "/chronograf/v1/layouts/ec6c48f4-48ca-4ba7-a842-5b700e19f274",
      "rel": "self"
    }
  },
  {
    "id": "4a805493-f7ef-4da0-8de8-e78afd899722",
    "app": "system",
    "measurement": "mem",
    "autoflow": true,
    "cells": [
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "e6e5063c-43d5-409b-a0ab-68da51ed3f28",
        "name": "System - Memory Bytes Used",
        "queries": [
          {
            "query": "SELECT mean(\"used\") AS \"used\", mean(\"available\") AS \"available\" FROM \"mem\""
          }
        ],
        "type": ""
      }
    ],
    "link": {
      "href": "/chronograf/v1/layouts/4a805493-f7ef-4da0-8de8-e78afd899722",
      "rel": "self"
    }
  },
  {
    "id": "4585a7db-73af-4ca1-9378-47ee67c71f99",
    "app": "system",
    "measurement": "net",
    "autoflow": true,
    "cells": [
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "e2f65d45-1898-4a16-860c-14b655575925",
        "name": "System – Network Mb/s",
        "queries": [
          {
            "query": "SELECT non_negative_derivative(max(\"bytes_recv\"), 1s) / 125000 as \"rx_megabits_per_second\" FROM \"net\"",
            "label": "Mb/s"
          },
          {
            "query": "SELECT non_negative_derivative(max(\"bytes_sent\"), 1s) / 125000 as \"tx_megabits_per_second\" FROM \"net\""
          }
        ],
        "type": ""
      },
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "5e957624-b28b-4904-8068-5e7a9a058609",
        "name": "System – Network Error Rate",
        "queries": [
          {
            "query": "SELECT non_negative_derivative(max(\"err_in\"), 1s) / 125000 as \"tx_errors_per_second\" FROM \"net\""
          },
          {
            "query": "SELECT non_negative_derivative(max(\"err_out\"), 1s) / 125000 as \"rx_errors_per_second\" FROM \"net\""
          }
        ],
        "type": ""
      }
    ],
    "link": {
      "href": "/chronograf/v1/layouts/4585a7db-73af-4ca1-9378-47ee67c71f99",
      "rel": "self"
    }
  },
  {
    "id": "ff41d044-f61a-4522-8de7-9e39e3a1b5de",
    "app": "system",
    "measurement": "netstat",
    "autoflow": true,
    "cells": [
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "cf5d0608-b513-4244-a55f-accf520da3a1",
        "name": "System - Open Sockets",
        "queries": [
          {
            "query": "SELECT mean(\"tcp_established\") AS \"tcp_established\" FROM netstat"
          },
          {
            "query": "SELECT mean(\"udp_socket\") AS \"udp_socket\" FROM netstat"
          }
        ],
        "type": ""
      },
      {
        "x": 4,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "63503235-a588-49a7-ae0a-fb015c888e5b",
        "name": "System - Sockets Created/Second ",
        "queries": [
          {
            "query": "SELECT non_negative_derivative(max(\"tcp_established\")) AS \"tcp_established\" FROM netstat"
          },
          {
            "query": "SELECT non_negative_derivative(max(\"udp_socket\")) AS \"udp_socket\" FROM netstat"
          }
        ],
        "type": ""
      }
    ],
    "link": {
      "href": "/chronograf/v1/layouts/ff41d044-f61a-4522-8de7-9e39e3a1b5de",
      "rel": "self"
    }
  },
  {
    "id": "ffad2dff-d263-412e-806a-1e836af87942",
    "app": "system",
    "measurement": "processes",
    "autoflow": true,
    "cells": [
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "84048146-f93d-4d6c-b7dd-c8e2a68abb27",
        "name": "System - Total Processes",
        "queries": [
          {
            "query": "SELECT mean(\"total\") AS \"total\" FROM processes"
          }
        ],
        "type": ""
      }
    ],
    "link": {
      "href": "/chronograf/v1/layouts/ffad2dff-d263-412e-806a-1e836af87942",
      "rel": "self"
    }
  },
  {
    "id": "44644fae-21e7-4897-81e6-b11d2643cd61",
    "app": "system",
    "measurement": "procstat",
    "autoflow": true,
    "cells": [
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "e75a6baa-9938-4ade-b83f-55a239039964",
        "name": "Processes – Resident Memory (MB)",
        "queries": [
          {
            "query": "SELECT max(\"memory_rss\") / 1000000 AS \"max_mb_memory_rss\" FROM \"procstat\"",
            "groupbys": [
              "\"exe\""
            ],
            "label": "MB"
          }
        ],
        "type": ""
      },
      {
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4,
        "i": "2bfae447-47c6-4f85-9fec-494301d29a04",
        "name": "Processes – CPU Usage %",
        "queries": [
          {
            "query": "SELECT max(\"cpu_usage\") AS \"cpu_usage\" FROM \"procstat\"",
            "groupbys": [
              "\"exe\""
            ],
            "label": "%"
          }
        ],
        "type": ""
      }
    ],
    "link": {
      "href": "/chronograf/v1/layouts/44644fae-21e7-4897-81e6-b11d2643cd61",
      "rel": "self"
    }
  }
];





const autoflowLayouts = (autoflowCase) => {
  switch (autoflowCase) {
    case '3x3':
      return stub;
    case 'garbage':
      const garbage = clone(stub);
      garbage[0].cells[0].queries[0].query = "SELECT mean(\"usage_user\") AS \"usage_user\" FROM \"foobar\"";
      return garbage;
    case 'stub2':
      return stub2;
    default:
      return []
  }
}

export default autoflowLayouts;
