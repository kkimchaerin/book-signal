### chaerin branch 참고

#  📖 Eye-tracking을 활용한 맞춤형 E-Book 웹 애플리케이션
## 프로젝트 소개
**Eye-tracking을 활용한 맞춤형 E-Book 웹 애플리케이션**은 사용자의 시선 데이터를 분석하여 독서 집중도를 측정하고, 집중한 페이지의 중요한 내용을 추출하여 시각적으로 매력적인 이미지를 생성하는 서비스입니다. 

## 배경
최근 디지털 콘텐츠 소비가 증가하면서 전자책, 온라인 기사, 학술 논문 등 다양한 형태의 디지털 독서가 활발해지고 있습니다. 이러한 변화에 발맞추어,
사용자의 시선 데이터를 기반으로 **독서 집중도를 분석**하고, **독서 습관을 파악하여 효율적이고 개인화된 독서 경험을 제공**하는 웹 애플리케이션을 개발하였습니다.

## 주요 기능
- **Eye-tracking 분석**: 웹 카메라를 통해 사용자의 시선을 실시간으로 추적하여 독서 집중도를 분석하고, 사용자가 집중한 페이지를 식별
- **중요 내용 추출 및 이미지 생성**: 집중한 페이지에서 중요한 내용을 추출하고, GPT API와 GPT DALL-E를 사용해 이미지로 시각화하여 제공.
- **자동 북마크 기능**: 사용자가 마지막으로 읽은 위치를 자동으로 저장하여 다음에 이어 읽을 수 있도록 지원<br>
  <img src = https://github.com/user-attachments/assets/17e392ed-9c30-4793-ba96-4f4fe2ee3096 width = '200px' hight = '200px' /> <br>
- **TTS(텍스트 음성 변환) 기능**: 텍스트를 음성으로 변환하여 사용자가 오디오로 도서를 감상할 수 있는 기능을 제공<br>
  <img src = https://github.com/user-attachments/assets/acdede98-37b9-4292-a7f7-df32a902a241 width = '200px' hight = '200px'/> <br>
- **사용자 맞춤형 UI/UX**: 글자 크기 및 글자체 변경 등 사용자의 편의성을 고려한 다양한 옵션을 제공 <br>
  <img src =https://github.com/user-attachments/assets/56eb8ad6-468d-41cf-873a-eb12f1bc7097 width= '200px' hight = '200px'/> <br>


## ⚙ 개발 환경
<img src = 'https://github.com/user-attachments/assets/63b6d045-e3cd-4fe7-9838-428941d94212' width= '500px' hight = '300px'/> <br>

### 기술 선택
- **React와 Node.js**는 웹 애플리케이션 개발에 있어 유연성과 성능을 제공합니다. 특히 실시간 데이터 처리와 상호작용적인 UI 구축에 적합하여, 독서 집중도 분석 및 맞춤형 콘텐츠 제공에 최적화된 환경을 마련합니다.
- **Eye-tracking SDK - seeso**는 사용자의 독서 행동을 정확히 분석하여 맞춤형 서비스를 제공하는 핵심 기술로, 개인화된 독서 경험을 구현하기 위해 선택하였습니다.
- **GPT API와 GPT DALL-E**는 AI 기반의 자연어 처리와 이미지 생성 기능을 통해, 독서 중 중요한 내용을 시각적으로 표현하여 사용자 참여를 유도합니다.
- **TTS API**는 시각 장애인 및 읽기에 어려움을 겪는 사용자들을 위한 기능으로, 포용적이고 접근 가능한 독서 환경을 조성하기 위해 도입하였습니다.
## ⏰ 개발 기간
24/07/29 ~ 24/09/12

## 서비스 흐름도
![image](https://github.com/user-attachments/assets/0b866a77-0021-4baa-8327-e3d30765dfe8)

## 프로젝트 역할 분담
| 이름   | 담당 업무                   |
| ------ | --------------------------- |
| 김채린 | PM, Back- end, Front-end |
| 김민석 | Back-end, 데이터 수집 |
| 김은석 | Back-end, DB 설계 및 구축 |
| 신현주 | Back- end, Front-end |
| 이선우 | Front-end, 디자인 |


