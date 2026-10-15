/* 클라우드 기초 70시간 과정 — 커리큘럼
 * 각 일차의 상세 내용은 lessons/dayNN.js 에서 UBUNTU_COURSE.addChapter({...}) 로 등록한다.
 */
window.UBUNTU_COURSE = {
  id: 'cloud70',
  vmKey: 'cloud70.vm.v1',
  assetVersion: 'c70-1',
  title: '클라우드 기초',
  subtitle: '70시간 · 10일 실습 과정',
  teacherPassword: '',
  parts: [
    { title: '개념과 준비', from: 'day01' },
    { title: '3대 클라우드 체험', from: 'day03' },
    { title: '내 무료 서버 키우기', from: 'day06' },
    { title: '심화 실습 (선택)', from: 'adv01' }
  ],
  order: [
    { id: 'day01', no: '01', title: '클라우드란 · 리눅스 첫걸음', icon: '☁️' },
    { id: 'day02', no: '02', title: '네트워크 · SSH 키 · 계정 안전장치', icon: '🔑' },
    { id: 'day03', no: '03', title: 'AWS — EC2와 S3', icon: '🟧' },
    { id: 'day04', no: '04', title: 'Microsoft Azure — VM과 App Service', icon: '🟦' },
    { id: 'day05', no: '05', title: 'Google Cloud — 상시 무료 VM', icon: '🟩' },
    { id: 'day06', no: '06', title: '내 무료 서버 — Oracle Cloud', icon: '🟥' },
    { id: 'day07', no: '07', title: '웹 서버와 Docker', icon: '🐳' },
    { id: 'day08', no: '08', title: 'Compose · 도메인 · HTTPS', icon: '🔒' },
    { id: 'day09', no: '09', title: '스토리지 · DB 백업 · 서버리스', icon: '🗄️' },
    { id: 'day10', no: '10', title: '보안 · 비용 · 마무리', icon: '🛡️' },
    { id: 'adv01', no: '+', title: '공인 IP 없는 서버 공개 — 터널', icon: '🚇', extra: true }
  ],
  chapters: {},
  addChapter: function (ch) { this.chapters[ch.id] = ch; }
};
