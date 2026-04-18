// 사용법: node generate-password-hash.js "원하는비밀번호"
// 결과로 출력되는 해시를 Vercel 환경변수 ADMIN_PASSWORD_HASH에 입력

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const password = process.argv[2];

if (!password) {
  console.log('\n❌ 비밀번호를 입력하세요.\n');
  console.log('사용법:');
  console.log('  node generate-password-hash.js "내비밀번호"\n');
  console.log('권장 비밀번호 규칙:');
  console.log('  • 12자 이상');
  console.log('  • 영문 대소문자 + 숫자 + 특수문자 혼합');
  console.log('  • 사전에 없는 단어');
  console.log('  • 생일·전화번호 금지\n');
  process.exit(1);
}

if (password.length < 8) {
  console.log('\n⚠️  비밀번호가 너무 짧습니다 (8자 이상 권장)\n');
}

console.log('\n생성 중...\n');

const hash = bcrypt.hashSync(password, 12); // 12 rounds = 매우 강력
const jwtSecret = crypto.randomBytes(32).toString('base64');

console.log('═══════════════════════════════════════════════════');
console.log('  Vercel 환경변수에 아래 2개 값을 등록하세요:');
console.log('═══════════════════════════════════════════════════\n');

console.log('▸ ADMIN_PASSWORD_HASH');
console.log(`  ${hash}\n`);

console.log('▸ ADMIN_JWT_SECRET');
console.log(`  ${jwtSecret}\n`);

console.log('═══════════════════════════════════════════════════');
console.log('  등록 방법:');
console.log('═══════════════════════════════════════════════════');
console.log('  1. Vercel 프로젝트 → Settings → Environment Variables');
console.log('  2. 위 두 값을 각각 Name에 키, Value에 값 입력');
console.log('  3. Production, Preview, Development 모두 체크');
console.log('  4. Save → 다음 배포부터 적용\n');

console.log('🔒 보안 주의:');
console.log('  • 이 해시값은 GitHub에 절대 올리지 마세요');
console.log('  • 비밀번호를 잊으면 다시 이 스크립트로 새로 생성하세요');
console.log('  • 이 화면을 닫으면 비밀번호 평문은 복구 불가능합니다\n');
