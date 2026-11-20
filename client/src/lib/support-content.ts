export const OPERATOR_NAME = 'MauGo'
export const SUPPORT_EMAIL = ''

export const supportContact = {
  en: SUPPORT_EMAIL
    ? `You can reach ${OPERATOR_NAME} at ${SUPPORT_EMAIL}.`
    : `To contact ${OPERATOR_NAME}, sign in, open Help & support, choose Feedback, and select Send feedback after writing your message.`,
  ko: SUPPORT_EMAIL
    ? `${OPERATOR_NAME}에 문의하려면 ${SUPPORT_EMAIL}로 이메일을 보내 주세요.`
    : `${OPERATOR_NAME}에 문의하려면 로그인한 뒤 도움말 및 지원에서 피드백을 선택하세요. 내용을 작성한 뒤 피드백 보내기를 선택하면 됩니다.`
}

export const legalVersion = {
  en: 'Version 1.0 · 21 November 2026',
  ko: '버전 1.0 · 2026년 11월 21일'
}

export const legalText = {
  privacy: {
    en: [
      {
        title: '1. Who we are and who may use the service',
        body: `This Privacy Policy explains how ${OPERATOR_NAME}, the operator of this service, handles personal information. The service is for people aged 18 and older. Profile age is self-reported. Registration does not ask for a date of birth or verify age. If you believe someone under 18 is using the service, please tell us using the contact route below.`
      },
      {
        title: '2. Account, security and device information',
        body: 'We store your email address, account ID, account creation time, a salted password hash, and the versions of the Terms and Privacy Policy submitted at registration and last successful sign-in, with the latest acceptance time. We store session token hashes and expiration times. For email verification and recovery we process your email address, verification code hashes, expiration times and attempt counts. We use email addresses and IP addresses to limit abuse and generate server request and error logs for operations and security. Your device can store a sign-in token, account ID, language and other preferences, local drafts and a salted hash of your app-lock PIN if you enable app lock.'
      },
      {
        title: '3. Profiles, discovery and conversations',
        body: 'We process profile details such as your display name, self-reported age and city, bio, zodiac sign, avatar and visibility settings. A gender field may be present in profile records. City is a profile field, and the service does not collect GPS location. We store letters, replies, chat text and uploaded media, including photos and voice messages you choose to record and send. We process discovery filters and browsing records, conversation preferences and read status, posts, image cards, likes, follows and profile visits to operate these features and show activity. Media files are stored on our servers with database records for their uploader, purpose, filename, type, size and upload time. Access to uploaded media requires sign-in and depends on its purpose and applicable permissions. Other members can see profile information and posts according to visibility and access settings. Letters and chats are available to their participants, subject to the service’s access rules, and submitted report evidence may be seen by authorized moderators. The service does not offer live voice or video calls.'
      },
      {
        title: '4. Purchases and support',
        body: 'Apple processes In-App Purchase payments and receives an account identifier used to associate your purchase with your account. We receive and verify Apple-signed transaction information and store the transaction and product identifiers, linked account, diamonds credited, resulting balance and refund status. We do not receive your payment card details. Our records also include wallet activity, reply collections and Filter Pass purchases and expiry. When you send feedback, we store your submission, category, optional contact address, account reference, status and timestamps on our servers. You can see your feedback history in the app. Authorized staff can access submissions to handle feedback and support requests.'
      },
      {
        title: '5. Safety and how information is shared',
        body: 'We use account and content information to run the service, deliver content, verify purchases, respond to feedback and protect users. You can report or block another member. We store block records and reports, including the people involved, the reason, any message reference or evidence you submit, and the outcome. Authorized moderators can handle reports and suspend accounts. Automated rules check submitted text in opening letters, messages and posts for prohibited content. When a rule blocks a submission, the filter log stores a digest, match categories and time. We use a configured email delivery service to send verification codes. We disclose information to other members as described above, to Apple for purchase processing and verification, and as required by applicable law. We use no analytics, crash-reporting or advertising SDKs.'
      },
      {
        title: '6. Retention and account deletion',
        body: 'We keep account and service records on our servers while your account is active. Session tokens expire after 30 days and email verification codes after 10 minutes. To close your account, go to Settings, then Account & security, then Delete account and confirm with your password. Deletion revokes sessions, removes sign-in credentials, clears key profile and consent fields, removes your posts, replaces your messages with a deletion marker, and removes your private wallet, reply collection and Filter Pass records. Most of your uploads are removed through a background cleanup process. We retain a deactivated account record and some linked records, including conversation references and preferences, feedback and its optional contact details, some profile and interaction data, Apple transaction records, reports and report evidence. These records may remain after closure for conversation continuity, purchase verification, support or moderation. Copies saved by other people are outside our control.'
      },
      {
        title: '7. Access, choices and other requests',
        body: 'You can edit your profile in the profile screen and manage visibility in Settings. You can also download a JSON copy of selected data in Settings, under Account & security, using Export my data. It includes selected profile and consent information, conversation and message records, post text, wallet and reply collection history, Filter Pass purchases and upload metadata. It does not include media files or every record we hold. Use the contact route below to ask about your information or exercise access, correction, deletion or other rights available under applicable law.'
      },
      {
        title: '8. Changes and contact',
        body: `The version and effective date appear at the start of this policy. We will post changes here with an updated version and effective date and provide further notice where required by law. ${supportContact.en}`
      }
    ],
    ko: [
      {
        title: '1. 운영자 및 이용 대상',
        body: `이 개인정보 처리방침은 서비스 운영자 ${OPERATOR_NAME}의 개인정보 처리 방법을 설명합니다. 서비스는 만 18세 이상만 이용할 수 있습니다. 프로필의 나이는 이용자가 직접 입력합니다. 가입 시 생년월일을 묻거나 나이를 확인하지 않습니다. 만 18세 미만인 사람이 서비스를 이용한다고 생각되면 아래 연락 방법을 통해 알려 주세요.`
      },
      {
        title: '2. 계정, 보안 및 기기 정보',
        body: '이메일 주소, 계정 ID, 계정 생성 시각, 솔트를 적용한 비밀번호 해시, 가입 및 마지막 로그인 성공 시 제출한 이용약관과 개인정보 처리방침의 버전 및 가장 최근 동의 시각을 저장합니다. 세션 토큰의 해시와 만료 시각을 저장합니다. 이메일 인증 및 계정 복구를 위해 이메일 주소, 인증 코드의 해시, 만료 시각 및 시도 횟수를 처리합니다. 이메일 주소와 IP 주소를 이용해 남용을 제한하고, 서비스 운영과 보안을 위해 서버 요청 및 오류 로그를 생성합니다. 기기에는 로그인 토큰, 계정 ID, 언어 및 기타 환경설정, 작성 중인 내용, 앱 잠금을 켠 경우 솔트를 적용한 앱 잠금 PIN의 해시가 저장될 수 있습니다.'
      },
      {
        title: '3. 프로필, 탐색 및 대화',
        body: '표시 이름, 직접 입력한 나이와 도시, 자기소개, 별자리, 아바타, 공개 범위 등 프로필 정보를 처리합니다. 프로필 기록에는 성별 항목이 포함될 수 있습니다. 도시는 프로필에 입력하는 항목이며, 서비스는 GPS 위치를 수집하지 않습니다. 편지, 답장, 채팅 텍스트 및 업로드한 미디어를 저장합니다. 여기에는 이용자가 선택한 사진과 직접 녹음하여 보낸 음성 메시지가 포함됩니다. 각 기능을 제공하고 활동을 표시하기 위해 탐색 필터 및 열람 기록, 대화 설정 및 읽음 상태, 게시물, 이미지 카드, 좋아요, 팔로우 및 프로필 방문 기록을 처리합니다. 미디어 파일은 서버에 저장되며, 업로더, 용도, 파일명, 유형, 크기, 업로드 시각은 데이터베이스에 기록됩니다. 업로드한 미디어에 접근하려면 로그인해야 하며, 접근 가능 여부는 용도와 해당 권한에 따라 정해집니다. 다른 회원은 공개 범위와 접근 설정에 따라 프로필 정보와 게시물을 볼 수 있습니다. 편지와 채팅은 서비스의 접근 규칙에 따라 대화 참여자에게 제공되며, 제출한 신고 증거는 권한 있는 운영 담당자가 볼 수 있습니다. 서비스는 실시간 음성 또는 영상 통화를 제공하지 않습니다.'
      },
      {
        title: '4. 구매 및 지원',
        body: 'Apple은 앱 내 구입 결제를 처리하며, 구매 내역과 서비스 계정을 연결하는 데 사용하는 계정 식별자를 받습니다. 당사는 Apple이 서명한 거래 정보를 수신하고 검증하며, 거래 및 상품 식별자, 연결된 계정, 지급된 다이아몬드, 지급 후 잔액 및 환불 여부를 저장합니다. 결제 카드 정보는 받지 않습니다. 지갑 이용 내역, 답장 수령 내역, 필터 패스 구매와 만료 정보도 기록합니다. 피드백을 보내면 제출 내용, 유형, 선택적으로 입력한 연락처, 계정 식별 정보, 처리 상태와 시각을 서버에 저장합니다. 앱에서 본인의 피드백 내역을 볼 수 있습니다. 권한 있는 담당자는 피드백과 지원 요청을 처리하기 위해 제출 내용을 열람할 수 있습니다.'
      },
      {
        title: '5. 안전 및 정보 제공',
        body: '계정 정보와 콘텐츠는 서비스 운영, 콘텐츠 전달, 구매 확인, 피드백 응답 및 이용자 보호에 사용합니다. 다른 회원을 신고하거나 차단할 수 있습니다. 차단 기록과 함께 신고 관련 당사자, 신고 사유, 제출된 메시지 식별 정보 또는 증거, 처리 결과를 저장합니다. 권한 있는 운영 담당자는 신고를 처리하고 계정을 정지할 수 있습니다. 자동 규칙으로 첫 편지, 메시지, 게시물에 입력된 텍스트에 금지된 내용이 있는지 확인합니다. 규칙에 따라 제출이 차단되면 필터 로그에 콘텐츠의 해시값, 일치 유형 및 시각이 기록됩니다. 인증 코드는 구성된 이메일 발송 서비스를 통해 전송합니다. 위에 설명한 범위에서 다른 회원에게 정보를 제공하며, 구매 처리 및 검증을 위해 Apple에, 관련 법률이 요구하는 경우에는 그에 따라 정보를 제공합니다. 분석, 앱 오류 수집 또는 광고용 SDK는 사용하지 않습니다.'
      },
      {
        title: '6. 보관 및 계정 삭제',
        body: '계정이 활성 상태인 동안 계정 및 서비스 기록을 서버에 보관합니다. 세션 토큰은 30일 후, 이메일 인증 코드는 10분 후 만료됩니다. 계정을 닫으려면 설정에서 계정 및 보안으로 이동한 후 계정 삭제를 선택하고 비밀번호로 확인하세요. 계정을 삭제하면 세션을 해제하고 로그인 자격 정보를 제거하며, 주요 프로필 및 동의 항목을 지우고 게시물을 삭제합니다. 작성한 메시지는 삭제 표시로 대체되며, 개인 지갑 내역, 답장 수령 내역 및 필터 패스 기록은 삭제됩니다. 업로드한 파일은 대부분 백그라운드 정리 절차를 통해 제거됩니다. 비활성화된 계정 기록과 일부 연결 기록은 보관됩니다. 여기에는 대화 식별 정보와 설정, 피드백 및 선택적으로 입력한 연락처, 일부 프로필 및 활동 데이터, Apple 거래 기록, 신고 및 신고 증거가 포함됩니다. 이러한 기록은 계정이 닫힌 뒤에도 대화의 연속성, 구매 검증, 고객 지원 또는 운영 관리를 위해 남을 수 있습니다. 다른 사람이 저장한 사본은 당사가 통제할 수 없습니다.'
      },
      {
        title: '7. 정보 열람, 설정 및 기타 요청',
        body: '프로필 화면에서 프로필을 수정하고 설정에서 공개 범위를 변경할 수 있습니다. 설정의 계정 및 보안에서 내 데이터 내보내기를 선택하면 일부 데이터의 JSON 사본을 내려받을 수 있습니다. 사본에는 일부 프로필 및 동의 정보, 대화 및 메시지 기록, 게시물 텍스트, 지갑 및 답장 수령 내역, 필터 패스 구매, 업로드 메타데이터가 포함됩니다. 미디어 파일이나 보유한 모든 기록이 포함되지는 않습니다. 정보에 대해 문의하거나 관련 법률에 따른 열람, 정정, 삭제 또는 기타 권리를 행사하려면 아래 연락 방법을 이용해 주세요.'
      },
      {
        title: '8. 변경 및 연락처',
        body: `버전과 시행일은 이 방침의 첫 부분에 표시됩니다. 방침이 바뀌면 새 버전 및 시행일과 함께 이곳에 게시하고, 법률에 따라 필요한 경우 별도로 알립니다. ${supportContact.ko}`
      }
    ]
  },
  terms: {
    en: [
      {
        title: '1. Agreement and eligibility',
        body: `These Terms of Use and End User License Agreement govern your use of the service and form an agreement between you and ${OPERATOR_NAME}, its operator. You must be at least 18 and legally able to enter into this agreement. Use the service only if you accept these Terms.`
      },
      {
        title: '2. Your account',
        body: 'Provide accurate information, keep your sign-in details secure and use only an account you are authorized to use. You are responsible for activity you authorize on your account. Tell us promptly if you believe someone has accessed your account without permission.'
      },
      {
        title: '3. License to use the app',
        body: `${OPERATOR_NAME} grants you a limited, personal, non-exclusive, non-transferable license to use the app under these Terms. The operator retains its rights in the app and brand. You may not resell the app, unlawfully copy or reverse engineer it, bypass access controls, scrape personal information or interfere with the service. You must comply with applicable law and third-party terms, including applicable app store and network service terms.`
      },
      {
        title: '4. Your content and conversations',
        body: `You keep ownership of your content and must have the rights and permissions needed to share it. You grant ${OPERATOR_NAME} a non-exclusive, royalty-free license to store and transmit your content, display it to the intended recipients or the audience allowed by your settings, and moderate it, only as needed to operate and protect the service, including handling retained safety records. You may send one opening letter per pair of accounts. When the opening sender collects a reply from the recipient, chat and attachments unlock. Incoming replies are subject to collection before they can be opened in chat. Do not bypass these controls or contact someone who has blocked you or asked you to stop.`
      },
      {
        title: '5. Conduct, safety and enforcement',
        body: `Harassment, threats, bullying, hate, sexual exploitation, unwanted sexual content, scams, spam, impersonation, unauthorized sharing of private information and other unlawful or rights-infringing conduct are prohibited. Use the Report and Block controls in letters or chat to report abuse or stop further contact through those features. We may reject prohibited submissions, hide content, and suspend or terminate access for violations, with notice where required by law. ${OPERATOR_NAME} does not conduct criminal background checks or guarantee anyone’s identity or conduct. You choose whether to interact with or meet other users and do so at your own risk. The service does not provide emergency assistance.`
      },
      {
        title: '6. Diamonds and Filter Pass',
        body: `Diamonds and Filter Pass are virtual items for use within ${OPERATOR_NAME}. They have no cash value, cannot be redeemed for cash and cannot be transferred. Where purchases are available, you buy diamonds through Apple In-App Purchase. Apple handles refund requests under its policies, subject to applicable consumer rights. After Apple confirms a refund, we mark the purchase as refunded and remove the credited diamonds if your balance is sufficient. The first 10 successful reply collections each day are free, with the allowance resetting at midnight in the Asia/Shanghai time zone. Each further reply costs 10 diamonds and requires your confirmation and a sufficient balance. Collecting the same reply again does not incur another charge. Filter Pass unlocks age and city filters for 1, 7 or 30 days, at a cost of 30, 150 or 480 diamonds respectively. A purchase adds time to any active pass or starts a new pass if none is active. The pass expires automatically and does not renew automatically.`
      },
      {
        title: '7. Privacy and closing your account',
        body: 'The Privacy Policy explains what we collect, how to export selected data, and what is removed or retained on account deletion. You can stop using the service at any time or close your account in Settings under Account & security by choosing Delete account and confirming with your password. Deletion ends your access, including access to any remaining diamonds and Filter Pass, subject to applicable law. We may end your access as described under Conduct, safety and enforcement.'
      },
      {
        title: '8. Availability and liability',
        body: `We may change or discontinue features, subject to applicable law and existing purchase rights. To the extent permitted by law, the service is provided as available and without implied warranties. We do not guarantee uninterrupted or error-free access, the accuracy of member content, or a particular outcome from using the service. To the extent permitted by law, ${OPERATOR_NAME} is not liable for indirect or consequential loss arising from use of the service, or for other members’ conduct. Nothing in these Terms limits rights, warranties or liability that cannot lawfully be limited.`
      },
      {
        title: '9. Apple distribution',
        body: `If you obtained the app through Apple, this agreement is with ${OPERATOR_NAME}. The operator is responsible for the app, its content, maintenance and support, and for addressing product, legal, privacy and intellectual property claims, including handling the defense and resolution of infringement claims. Apple has no duty to provide maintenance or support. Use the app on Apple devices you own or control under Apple’s usage rules, including allowed Family Sharing or volume purchasing access. If the app fails to meet an applicable warranty, you may notify Apple for a refund of the app purchase price. To the extent permitted by law, any remaining warranty obligations and related claims or losses are the operator’s responsibility. You confirm that you are not in a U.S.-embargoed country or a country designated by the U.S. government as supporting terrorism, and are not on a U.S. government restricted-party list. Apple and its subsidiaries may enforce these Terms as third-party beneficiaries once you accept them.`
      },
      {
        title: '10. Governing law and changes',
        body: `These Terms are governed by the laws of the jurisdiction in which the operator of ${OPERATOR_NAME} is established. Mandatory protections that apply where you live still apply. We will publish changes here with an updated version and effective date and give further notice or obtain renewed agreement where required by law.`
      },
      {
        title: '11. Contact',
        body: supportContact.en
      }
    ],
    ko: [
      {
        title: '1. 계약 및 이용 자격',
        body: `이 이용약관 및 최종 사용자 라이선스 계약은 서비스 이용에 적용되며, 이용자와 서비스 운영자인 ${OPERATOR_NAME} 사이에 체결됩니다. 이용자는 만 18세 이상이며 이 계약을 체결할 법적 능력이 있어야 합니다. 이 약관에 동의하는 경우에만 서비스를 이용할 수 있습니다.`
      },
      {
        title: '2. 계정',
        body: '정확한 정보를 제공하고 로그인 정보를 안전하게 관리하며, 사용 권한이 있는 계정만 이용해야 합니다. 이용자가 승인한 계정 활동은 이용자의 책임입니다. 허락 없이 계정에 접근한 사람이 있다고 생각되면 즉시 알려 주세요.'
      },
      {
        title: '3. 앱 이용 라이선스',
        body: `${OPERATOR_NAME}는 이 약관에 따라 앱을 사용할 수 있는 개인적이고 제한적이며 비독점적이고 양도할 수 없는 라이선스를 부여합니다. 앱과 브랜드에 대한 권리는 운영자에게 있습니다. 앱의 재판매, 불법 복제 또는 역공학, 접근 통제 우회, 개인정보의 자동 수집 및 서비스 방해를 금지합니다. 관련 법률과 앱 스토어 및 통신 서비스 약관을 포함하여 적용되는 제3자 약관을 준수해야 합니다.`
      },
      {
        title: '4. 콘텐츠 및 대화',
        body: `이용자는 본인 콘텐츠의 소유권을 유지하며, 이를 공유하는 데 필요한 권리와 허락을 확보해야 합니다. 이용자는 ${OPERATOR_NAME}에 서비스를 운영하고 보호하는 데 필요한 범위에서만 콘텐츠를 저장, 전송하고, 의도된 수신자 또는 공개 설정이 허용하는 대상에게 표시하며, 운영 기준에 따라 관리할 수 있는 비독점적이고 사용료 없는 라이선스를 부여합니다. 여기에는 보관된 안전 관련 기록의 처리가 포함됩니다. 한 계정 쌍 사이에서 첫 편지는 한 번만 보낼 수 있습니다. 첫 편지를 보낸 사람이 상대의 답장 하나를 수령하면 채팅과 첨부 기능이 열립니다. 도착한 답장은 수령한 후 채팅에서 열 수 있습니다. 이러한 통제를 우회하거나, 자신을 차단했거나 연락 중단을 요청한 사람에게 연락하지 마세요.`
      },
      {
        title: '5. 이용 수칙, 안전 및 조치',
        body: `괴롭힘, 위협, 따돌림, 혐오, 성적 착취, 원치 않는 성적 콘텐츠, 사기, 스팸, 사칭, 허락 없는 개인정보 공유 및 기타 불법 행위나 권리 침해를 금지합니다. 편지나 채팅의 신고 및 차단 기능을 사용하여 피해를 알리거나 해당 기능을 통한 추가 연락을 막을 수 있습니다. 당사는 금지된 내용의 제출을 거부하거나 콘텐츠를 숨길 수 있으며, 위반 시 서비스 접근을 정지하거나 종료할 수 있습니다. 법률에서 요구하는 경우 이를 알립니다. ${OPERATOR_NAME}는 범죄 경력 조회를 실시하지 않으며 이용자의 신원이나 행동을 보증하지 않습니다. 다른 이용자와 연락하거나 만날지는 본인이 결정하며, 그에 따른 위험은 본인이 부담합니다. 서비스는 긴급 지원을 제공하지 않습니다.`
      },
      {
        title: '6. 다이아몬드 및 필터 패스',
        body: `다이아몬드와 필터 패스는 ${OPERATOR_NAME} 내에서 사용하는 가상 아이템입니다. 현금 가치가 없으며 현금으로 교환하거나 양도할 수 없습니다. 구매가 가능한 경우 다이아몬드는 Apple 앱 내 구입을 통해 구매합니다. Apple은 관련 소비자 권리를 보장하는 범위에서 자체 정책에 따라 환불 요청을 처리합니다. Apple이 환불을 확인하면 구매 건을 환불로 표시하며, 잔액이 충분한 경우 지급했던 다이아몬드를 회수합니다. 매일 처음 성공적으로 받은 답장 10개는 무료이며, 무료 한도는 아시아/상하이 시간대 자정에 초기화됩니다. 이후에는 답장 1개당 다이아몬드 10개가 필요하며, 이용자의 확인과 충분한 잔액이 있어야 합니다. 같은 답장을 다시 받아도 추가로 차감하지 않습니다. 필터 패스는 나이 및 도시 필터를 1일, 7일 또는 30일 동안 이용할 수 있게 하며, 각각 다이아몬드 30개, 150개, 480개가 필요합니다. 구매하면 활성 패스의 기간이 연장되고, 활성 패스가 없으면 새 패스가 시작됩니다. 패스는 기간이 지나면 자동으로 만료되며 자동 갱신되지 않습니다.`
      },
      {
        title: '7. 개인정보 및 계정 종료',
        body: '개인정보 처리방침에는 수집하는 정보, 일부 데이터를 내보내는 방법, 계정 삭제 시 삭제하거나 보관하는 정보가 설명되어 있습니다. 언제든지 서비스 이용을 중단하거나, 설정의 계정 및 보안에서 계정 삭제를 선택하고 비밀번호로 확인하여 계정을 닫을 수 있습니다. 계정을 삭제하면 관련 법률이 허용하는 범위에서 남은 다이아몬드와 필터 패스를 포함한 서비스 이용 권한이 종료됩니다. 당사는 이용 수칙, 안전 및 조치 항목에 설명한 바에 따라 이용자의 접근을 종료할 수 있습니다.'
      },
      {
        title: '8. 서비스 제공 및 책임',
        body: `당사는 관련 법률 및 기존 구매 권리를 준수하는 범위에서 기능을 변경하거나 중단할 수 있습니다. 법률이 허용하는 범위에서 서비스는 제공 가능한 상태로 제공되며 묵시적 보증은 적용되지 않습니다. 중단이나 오류 없는 접근, 회원 콘텐츠의 정확성 또는 서비스 이용을 통한 특정 결과를 보장하지 않습니다. 법률이 허용하는 범위에서 ${OPERATOR_NAME}는 서비스 이용에 따른 간접 손해나 결과적 손해, 또는 다른 회원의 행위에 대해 책임을 지지 않습니다. 이 약관은 법적으로 제한할 수 없는 권리, 보증 또는 책임을 제한하지 않습니다.`
      },
      {
        title: '9. Apple 배포',
        body: `Apple을 통해 앱을 받았다면 이 계약의 상대방은 ${OPERATOR_NAME}입니다. 앱과 콘텐츠, 유지보수 및 지원, 제품, 법률, 개인정보 및 지식재산권 관련 청구의 처리는 운영자의 책임이며 여기에는 지식재산권 침해 청구에 대한 방어 및 해결이 포함됩니다. Apple은 유지보수 또는 지원 의무를 부담하지 않습니다. 허용된 가족 공유 또는 대량 구매를 통한 접근을 포함하여 Apple의 이용 규칙에 따라 본인이 소유하거나 관리하는 Apple 기기에서 앱을 사용해야 합니다. 앱이 적용되는 보증을 충족하지 못할 경우 Apple에 알려 앱 구매 금액의 환불을 요청할 수 있습니다. 법률이 허용하는 범위에서 나머지 보증 의무와 관련 청구 또는 손실은 운영자의 책임입니다. 이용자는 미국의 금수 조치 대상국이나 미국 정부가 테러 지원국으로 지정한 국가에 있지 않으며, 미국 정부의 거래 제한 대상자 명단에 올라 있지 않음을 확인합니다. 이용자가 동의하면 Apple과 그 자회사는 제3자 수익자로서 이 약관을 집행할 수 있습니다.`
      },
      {
        title: '10. 준거법 및 변경',
        body: `이 약관에는 ${OPERATOR_NAME} 운영자가 설립된 관할 지역의 법률이 적용됩니다. 이용자가 거주하는 곳에서 적용되는 강행법규에 따른 보호는 계속 적용됩니다. 약관이 바뀌면 새 버전 및 시행일과 함께 이곳에 게시하고, 법률에서 요구하는 경우 별도로 알리거나 다시 동의를 받습니다.`
      },
      {
        title: '11. 연락처',
        body: supportContact.ko
      }
    ]
  }
}

export const faqs = [
  ['How do letters work?', 'Tap a bird, then send one opening message. Wait for their reply before chatting, following or sending attachments.'],
  ['How many replies can I collect?', 'Collect 10 replies free each day. Further replies cost 10 diamonds each and need your confirmation.'],
  ['Are all birds free?', 'Yes. All nine bird styles and both bird types are free to choose.'],
  ['How does Filter Pass work?', 'Use diamonds to unlock age and city filters for 1, 7 or 30 days. Extra days extend the expiry. There is no automatic renewal.'],
  ['Where are my messages saved?', 'Messages and feedback you submit are stored on our servers.'],
  ['How do I delete my data?', 'Open Settings → Account & security → Delete account.']
]
export const guides = {
  guidelines: [['Be kind', 'Treat each person with care. Harassment, threats and unwanted sexual content do not belong here.'], ['Respect privacy', 'Do not share someone else’s personal information. Ask before sharing private conversations.'], ['Use your own words', 'Avoid spam, impersonation and scams. Report unwanted messages and block people when needed.']],
  safety: [['Protect your account', 'Keep passwords and verification codes private. Never send them in a chat.'], ['Be careful with links', 'Avoid unfamiliar downloads or payment requests from strangers.'], ['Stay in control', 'Report suspicious contact, block unwanted messages, and use the Privacy controls.']]
}
