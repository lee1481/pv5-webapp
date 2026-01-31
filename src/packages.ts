// 제품 패키지 데이터 타입 정의
export interface MaterialItem {
  name: string;
  quantity: number | string;
}

export interface PackageSection {
  title: string;
  items: MaterialItem[];
}

export interface ProductPackage {
  id: string;
  brand: 'milwaukee' | 'kia';
  name: string;
  fullName: string;
  description: string;
  price: number;
  image: string;
  sections: PackageSection[];
  hasPositionOption?: boolean; // 좌/우 선택 옵션 여부
}

// 밀워키 제품 패키지
export const milwaukeePackages: ProductPackage[] = [
  {
    id: 'milwaukee-workstation',
    brand: 'milwaukee',
    name: 'PV5 밀워키 워크스테이션',
    fullName: 'PV5 기아 밀워키 워크스테이션',
    description: '격벽타공판 + 격벽2단선반 + 워크스페이스 + 툴박스',
    price: 4850000,
    image: '/static/images/milwaukee-workstation.jpg',
    sections: [
      {
        title: '기초자재',
        items: [
          { name: '태고합판 / 알루미늄체크판 / 논슬립', quantity: '1식' }
        ]
      },
      {
        title: '격벽타공판',
        items: [
          { name: 'M 격벽타공판', quantity: 1 },
          { name: 'M 타공판보강대', quantity: 3 },
          { name: '브라켓 (상/중/하)', quantity: '각 2' }
        ]
      },
      {
        title: '격벽2단선반',
        items: [
          { name: 'M 2단 트레이', quantity: 1 },
          { name: 'M 2단 트레이 로고', quantity: 1 },
          { name: 'M 2단 프레임', quantity: 2 },
          { name: 'M 트레이보강대', quantity: 4 }
        ]
      },
      {
        title: '워크스페이스',
        items: [
          { name: 'M 워크 타공판', quantity: 1 },
          { name: 'M 워크 프레임 / 로고', quantity: '각 1' },
          { name: 'M 워크 상판로고', quantity: 1 },
          { name: 'M 3단 트레이/워크트레이', quantity: 1 },
          { name: 'M 워크 세로보강대 (좌,우측)', quantity: 2 },
          { name: 'M 워크 조명커버', quantity: 1 },
          { name: 'M 트레이보강대', quantity: 2 },
          { name: 'M 워크 트렁크브라켓', quantity: 1 },
          { name: 'M 도어브라켓 - 우', quantity: 1 }
        ]
      },
      {
        title: '툴박스',
        items: [
          { name: '팩아웃 거치대', quantity: 4 },
          { name: '팩아웃 라지 툴박스', quantity: 1 },
          { name: '오픈형 툴박스', quantity: 1 }
        ]
      }
    ]
  },
  {
    id: 'milwaukee-smart',
    brand: 'milwaukee',
    name: 'PV5 밀워키 스마트 에디션',
    fullName: 'PV5 기아 밀워키 스마트 에디션',
    description: '격벽타공판 + 격벽2단선반 + 3단선반 + 툴박스',
    price: 5200000,
    image: '/static/images/milwaukee-smart.jpg',
    sections: [
      {
        title: '기초자재',
        items: [
          { name: '태고합판 / 알루미늄체크판 / 논슬립', quantity: '1식' }
        ]
      },
      {
        title: '격벽타공판',
        items: [
          { name: 'M 격벽타공판', quantity: 1 },
          { name: 'M 타공판보강대', quantity: 3 },
          { name: '브라켓 (상/중/하)', quantity: '각 2' }
        ]
      },
      {
        title: '격벽2단선반',
        items: [
          { name: 'M 2단 트레이', quantity: 1 },
          { name: 'M 2단 트레이 로고', quantity: 1 },
          { name: 'M 2단 프레임', quantity: 2 },
          { name: 'M 트레이보강대', quantity: 4 }
        ]
      },
      {
        title: '3단선반 (좌/우측)',
        items: [
          { name: 'M 3단 트레이/워크트레이', quantity: 2 },
          { name: 'M 3단 트레이 로고', quantity: 1 },
          { name: 'M 3단 프레임 로고 (좌/우측)', quantity: '각 1' },
          { name: 'M 3단 프레임', quantity: 1 },
          { name: 'M 트레이보강대', quantity: 6 },
          { name: 'M 트렁크 브라켓', quantity: 1 },
          { name: 'M 도어브라켓 (좌)', quantity: 1 },
          { name: 'M 도어브라켓 (우)', quantity: 1 }
        ]
      },
      {
        title: '툴박스',
        items: [
          { name: '팩아웃 거치대', quantity: 8 },
          { name: '팩아웃 라지 툴박스', quantity: 1 },
          { name: '오픈형 툴박스', quantity: 1 }
        ]
      }
    ]
  },
  {
    id: 'milwaukee-3shelf-parts',
    brand: 'milwaukee',
    name: 'PV5 밀워키 3단 부품선반',
    fullName: 'PV5 기아 밀워키 3단 부품선반 (좌/우측)',
    description: '밀워키 단품 - 3단 부품선반',
    price: 1800000,
    image: '/static/images/milwaukee-3shelf-parts.jpg',
    hasPositionOption: true,
    sections: [
      {
        title: '3단 부품선반 (좌/우측)',
        items: [
          { name: 'M 부품 트레이', quantity: 2 },
          { name: 'M 부품 트레이 로고', quantity: 1 },
          { name: 'M 부품 프레임 (일반)', quantity: 1 },
          { name: 'M 부품 프레임 (좌측/우측)', quantity: '각 1' },
          { name: 'M 부품 보강대', quantity: 6 },
          { name: 'M 트렁크 브라켓', quantity: 1 },
          { name: 'M 도어브라켓 (좌/우)', quantity: '각 1' }
        ]
      }
    ]
  },
  {
    id: 'milwaukee-3shelf-standard',
    brand: 'milwaukee',
    name: 'PV5 밀워키 3단 선반',
    fullName: 'PV5 기아 밀워키 3단 선반 (좌/우측)',
    description: '밀워키 단품 - 3단 선반',
    price: 1900000,
    image: '/static/images/milwaukee-3shelf-standard.jpg',
    hasPositionOption: true,
    sections: [
      {
        title: '3단 선반 (좌/우측)',
        items: [
          { name: 'M 3단 트레이/워크트레이', quantity: 2 },
          { name: 'M 3단 트레이 로고', quantity: 1 },
          { name: 'M 3단 프레임 로고 (좌/우측)', quantity: '각 1' },
          { name: 'M 3단 프레임', quantity: 1 },
          { name: 'M 트레이 보강대', quantity: 6 },
          { name: 'M 트렁크 브라켓', quantity: 1 },
          { name: 'M 도어브라켓 (좌/우)', quantity: '각 1' }
        ]
      }
    ]
  },
  {
    id: 'milwaukee-2shelf-partition',
    brand: 'milwaukee',
    name: 'PV5 밀워키 2단 선반',
    fullName: 'PV5 카고 밀워키 2단 선반',
    description: '밀워키 단품 - 2단 선반',
    price: 1500000,
    image: '/static/images/milwaukee-2shelf-partition.jpg',
    sections: [
      {
        title: '격벽 2단선반',
        items: [
          { name: 'M 2단 트레이', quantity: 1 },
          { name: 'M 2단 트레이 로고', quantity: 1 },
          { name: 'M 2단 프레임', quantity: 2 },
          { name: 'M 트레이보강대', quantity: 4 }
        ]
      }
    ]
  },
  {
    id: 'milwaukee-partition-panel',
    brand: 'milwaukee',
    name: 'PV5 밀워키 격벽타공판',
    fullName: 'PV5 카고 밀워키 격벽타공판',
    description: '밀워키 단품 - 격벽타공판',
    price: 1200000,
    image: '/static/images/milwaukee-partition-panel.jpg',
    sections: [
      {
        title: '격벽타공판',
        items: [
          { name: 'M 격벽타공판', quantity: 1 },
          { name: 'M 타공판보강대', quantity: 3 },
          { name: '브라켓 (상/중/하)', quantity: '각 2' }
        ]
      }
    ]
  },
  {
    id: 'milwaukee-floor-board',
    brand: 'milwaukee',
    name: '적재함 평탄화 보드',
    fullName: '적재함 평탄화 보드 (태고합판 + 알루미늄체크판 + 논슬립)',
    description: '공통 단품 - 적재함 평탄화 보드',
    price: 800000,
    image: '/static/images/floor-board.jpg',
    sections: [
      {
        title: '적재함 평탄화 보드',
        items: [
          { name: '태고합판', quantity: 1 },
          { name: '알루미늄체크판', quantity: 1 },
          { name: '논슬립', quantity: 1 }
        ]
      }
    ]
  }
];

// 기아 제품 패키지
export const kiaPackages: ProductPackage[] = [
  {
    id: 'kia-workstation',
    brand: 'kia',
    name: '기아 PV5 워크스테이션',
    fullName: '기아 PV5 순정형 워크스테이션',
    description: '격벽타공판 + 3단부품선반 + 워크스페이스',
    price: 4200000,
    image: '/static/images/kia-workstation.jpg',
    sections: [
      {
        title: '기초자재',
        items: [
          { name: '태고합판 / 알루미늄체크판 / 논슬립', quantity: '1식' }
        ]
      },
      {
        title: '격벽타공판',
        items: [
          { name: '격벽타공판', quantity: 1 },
          { name: '타공판보강대', quantity: 3 },
          { name: '브라켓 (상/중/하)', quantity: '각 2' }
        ]
      },
      {
        title: '3단부품선반',
        items: [
          { name: '부품 트레이', quantity: 2 },
          { name: '부품 트레이 로고', quantity: 1 },
          { name: '부품 프레임 (일반)', quantity: 1 },
          { name: '부품 프레임 (좌측)', quantity: 1 },
          { name: '부품 보강대', quantity: 6 },
          { name: '트렁크 브라켓', quantity: 1 },
          { name: '도어브라켓 (좌측/우측)', quantity: 1 }
        ]
      },
      {
        title: '워크스페이스',
        items: [
          { name: '워크 타공판', quantity: 1 },
          { name: '워크 프레임 / 로고', quantity: '각 1' },
          { name: '워크 상판로고', quantity: 1 },
          { name: '3단 트레이/워크트레이', quantity: 1 },
          { name: '워크 세로보강대', quantity: 2 },
          { name: '워크 조명커버', quantity: 1 },
          { name: '트레이보강대', quantity: 2 },
          { name: '트렁크보강대', quantity: 1 },
          { name: '도어브라켓 - 우', quantity: 1 },
          { name: '트렁크 브라켓', quantity: 1 }
        ]
      }
    ]
  },
  {
    id: 'kia-smart',
    brand: 'kia',
    name: '기아 PV5 스마트 패키지',
    fullName: '기아 PV5 순정형 스마트 패키지',
    description: '격벽타공판 + 2단선반 + 3단선반',
    price: 4500000,
    image: '/static/images/kia-smart.jpg',
    sections: [
      {
        title: '기초자재',
        items: [
          { name: '태고합판 / 알루미늄체크판 / 논슬립', quantity: '1식' }
        ]
      },
      {
        title: '격벽타공판',
        items: [
          { name: '격벽타공판', quantity: 1 },
          { name: '타공판보강대', quantity: 3 },
          { name: '브라켓 (상/중/하)', quantity: '각 2' }
        ]
      },
      {
        title: '2단선반',
        items: [
          { name: '2단 트레이', quantity: 1 },
          { name: '2단 트레이 로고', quantity: 1 },
          { name: '2단 프레임', quantity: 2 },
          { name: '트레이보강대', quantity: 4 }
        ]
      },
      {
        title: '3단선반 (좌/우측)',
        items: [
          { name: '3단 트레이/워크트레이', quantity: 2 },
          { name: '3단 트레이 로고', quantity: 1 },
          { name: '3단 프레임 로고 (좌/우측)', quantity: '각 1' },
          { name: '3단 프레임', quantity: 1 },
          { name: '트레이보강대', quantity: 6 },
          { name: '트렁크보강대', quantity: 1 },
          { name: '도어브라켓 (좌)', quantity: 1 },
          { name: '도어브라켓 (우)', quantity: 1 },
          { name: '트렁크브라켓 (좌,우)', quantity: 1 }
        ]
      }
    ]
  },
  {
    id: 'kia-3shelf-parts',
    brand: 'kia',
    name: '기아 PV5 3단 부품선반',
    fullName: '기아 PV5 순정형 3단 부품선반 (좌/우측)',
    description: '기아 단품 - 3단 부품선반',
    price: 1600000,
    image: '/static/images/kia-3shelf-parts.jpg',
    hasPositionOption: true,
    sections: [
      {
        title: '3단 부품선반 (좌/우측)',
        items: [
          { name: '부품 트레이', quantity: 2 },
          { name: '부품 트레이 로고', quantity: 1 },
          { name: '부품 프레임 (일반)', quantity: 1 },
          { name: '부품 프레임 (좌측/우측)', quantity: '각 1' },
          { name: '부품 보강대', quantity: 6 },
          { name: '트렁크 브라켓', quantity: 1 },
          { name: '도어브라켓 (좌)', quantity: 1 },
          { name: '도어브라켓 (우)', quantity: 1 }
        ]
      }
    ]
  },
  {
    id: 'kia-3shelf-standard',
    brand: 'kia',
    name: '기아 PV5 3단 선반',
    fullName: '기아 PV5 순정형 3단 선반 (좌/우측)',
    description: '기아 단품 - 3단 선반',
    price: 1700000,
    image: '/static/images/kia-3shelf-standard.jpg',
    hasPositionOption: true,
    sections: [
      {
        title: '3단 선반 (좌/우측)',
        items: [
          { name: '3단 트레이/워크트레이', quantity: 2 },
          { name: '3단 트레이 로고', quantity: 1 },
          { name: '3단 프레임 로고 (좌/우측)', quantity: '각 1' },
          { name: '3단 프레임', quantity: 1 },
          { name: '트레이 보강대', quantity: 6 },
          { name: '트렁크 보강대', quantity: 1 },
          { name: '도어브라켓 (좌)', quantity: 1 },
          { name: '도어브라켓 (우)', quantity: 1 },
          { name: '트렁크브라켓 (좌,우)', quantity: 1 }
        ]
      }
    ]
  },
  {
    id: 'kia-2shelf-partition',
    brand: 'kia',
    name: 'PV5 카고 격벽 2단선반',
    fullName: 'PV5 카고 격벽 2단선반',
    description: '기아 단품 - 격벽 2단선반',
    price: 1400000,
    image: '/static/images/kia-2shelf-partition.jpg',
    sections: [
      {
        title: '격벽 2단선반',
        items: [
          { name: '2단 트레이', quantity: 1 },
          { name: '2단 트레이 로고', quantity: 1 },
          { name: '2단 프레임', quantity: 2 },
          { name: '트레이보강대', quantity: 4 }
        ]
      }
    ]
  },
  {
    id: 'kia-partition-panel',
    brand: 'kia',
    name: '기아 PV5 격벽타공판',
    fullName: '기아 PV5 순정형 격벽타공판',
    description: '기아 단품 - 격벽타공판',
    price: 1100000,
    image: '/static/images/kia-partition-panel.jpg',
    sections: [
      {
        title: '격벽타공판',
        items: [
          { name: '격벽타공판', quantity: 1 },
          { name: '타공판보강대', quantity: 3 },
          { name: '브라켓 (상/중/하)', quantity: '각 2' }
        ]
      }
    ]
  },
  {
    id: 'kia-floor-board',
    brand: 'kia',
    name: '적재함 평탄화 보드',
    fullName: '적재함 평탄화 보드 (태고합판 + 알루미늄체크판 + 논슬립)',
    description: '공통 단품 - 적재함 평탄화 보드',
    price: 800000,
    image: '/static/images/floor-board.jpg',
    sections: [
      {
        title: '적재함 평탄화 보드',
        items: [
          { name: '태고합판', quantity: 1 },
          { name: '알루미늄체크판', quantity: 1 },
          { name: '논슬립', quantity: 1 }
        ]
      }
    ]
  }
];

// 전체 제품 패키지
export const allPackages: ProductPackage[] = [
  ...milwaukeePackages,
  ...kiaPackages
];

// ID로 패키지 찾기
export function getPackageById(id: string): ProductPackage | undefined {
  return allPackages.find(pkg => pkg.id === id);
}

// 브랜드별 패키지 가져오기
export function getPackagesByBrand(brand: 'milwaukee' | 'kia'): ProductPackage[] {
  return brand === 'milwaukee' ? milwaukeePackages : kiaPackages;
}
