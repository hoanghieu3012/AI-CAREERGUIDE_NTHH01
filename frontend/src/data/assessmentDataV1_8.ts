/**
 * Khung đánh giá trắc nghiệm sở thích nghề nghiệp và thiên hướng nhận thức chuẩn v1.8
 * (Thông tư 74/2026/TT-BGDĐT).
 * 
 * LƯU Ý QUAN TRỌNG:
 * Toàn bộ dữ liệu bộ câu hỏi chính thức (30 câu RIASEC, 8 câu Cognitive + 32 tùy chọn)
 * được LƯU TRỮ VÀ QUẢN LÝ TẬP TRUNG TRONG CƠ SỞ DỮ LIỆU POSTGRESQL (bảng assessment_question_sets).
 * Tệp này đóng vai trò Fallback cấu hình khi thiết bị ngoại tuyến hoặc mất kết nối mạng.
 */
import { ActiveQuestionSet } from '../types';

export const OFFICIAL_QUESTION_SET_V1_8: ActiveQuestionSet = {
  version: "1.8",
  circular_ref: "74/2026/TT-BGDĐT",
  project: "AI CareerGuide - CMU-SE 450 (C1SE.71)",
  set_id: "742026-v1-8-riasec-cognitive-standard",
  set_code: "RIASEC_COG_V1_8",
  title: "Bộ câu hỏi Đánh giá Sở thích & Thiên hướng Nhận thức chuẩn v1.8 (CSDL PostgreSQL)",
  config: {
    xp_per_question: 25,
    completion_bonus_xp: 200,
    estimated_minutes: 6,
    questions_per_riasec_page: 5,
    total_riasec_questions: 30,
    total_cognitive_questions: 8,
    weights: {
      riasec: 0.45,
      academic: 0.35,
      cognitive_preference: 0.2
    }
  },
  likert_scale: [
    { value: 1, label: "Rất không thích", emoji: "😣", weight: 0.0 },
    { value: 2, label: "Không thích", emoji: "🙁", weight: 0.25 },
    { value: 3, label: "Bình thường", emoji: "😐", weight: 0.5 },
    { value: 4, label: "Khá thích", emoji: "🙂", weight: 0.75 },
    { value: 5, label: "Rất yêu thích", emoji: "🤩", weight: 1.0 }
  ],
  riasec_groups: [
    {
      dimension: "R",
      step_index: 1,
      name_vi: "Thực tế",
      name_en: "Realistic",
      badge: "Thực tế (Realistic)",
      description: "Ưa thích thao tác với máy móc, thiết bị kỹ thuật, công trình và hoạt động thực địa.",
      related_moet_field_codes: ["51", "52", "54", "58", "62", "64", "84", "86"]
    },
    {
      dimension: "I",
      step_index: 2,
      name_vi: "Nghiên cứu",
      name_en: "Investigative",
      badge: "Nghiên cứu (Investigative)",
      description: "Đam mê khám phá nguyên lý khoa học, toán học, lập trình AI, y sinh và phân tích chuyên sâu.",
      related_moet_field_codes: ["42", "44", "46", "48", "72", "31"]
    },
    {
      dimension: "A",
      step_index: 3,
      name_vi: "Nghệ thuật",
      name_en: "Artistic",
      badge: "Nghệ thuật (Artistic)",
      description: "Giàu trí tưởng tượng, yêu thích thiết kế đồ họa, kiến trúc, âm nhạc và sáng tạo.",
      related_moet_field_codes: ["21", "22", "32", "58"]
    },
    {
      dimension: "S",
      step_index: 4,
      name_vi: "Xã hội",
      name_en: "Social",
      badge: "Xã hội (Social)",
      description: "Thích giao tiếp, giảng dạy, tư vấn tâm lý, chăm sóc sức khỏe cộng đồng và làm việc nhóm.",
      related_moet_field_codes: ["14", "76", "81", "38"]
    },
    {
      dimension: "E",
      step_index: 5,
      name_vi: "Quản lý",
      name_en: "Enterprising",
      badge: "Quản lý (Enterprising)",
      description: "Tự tin lãnh đạo, điều hành dự án, thuyết trình, kinh doanh và hoạch định chiến lược.",
      related_moet_field_codes: ["34", "81", "38", "31"]
    },
    {
      dimension: "C",
      step_index: 6,
      name_vi: "Nghiệp vụ",
      name_en: "Conventional",
      badge: "Nghiên cứu / Nghiệp vụ (Conventional)",
      description: "Cẩn thận, tỉ mỉ, thích làm việc với dữ liệu số liệu, văn bản quy chuẩn, kế toán và quy trình.",
      related_moet_field_codes: ["34", "46", "48", "38"]
    }
  ],
  riasec_questions: [
    { code: "R1", dimension: "R", dimension_badge: "Thực tế (Realistic)", domain_tag: "Kỹ thuật & Cơ khí", icon_name: "Wrench", question_text: "Tôi thích tự tay tháo lắp, sửa chữa các linh kiện cơ khí hoặc đồ điện tử trong nhà.", order_index: 1, xp_reward: 25 },
    { code: "R2", dimension: "R", dimension_badge: "Thực tế (Realistic)", domain_tag: "Nông Lâm & Môi trường", icon_name: "Sprout", question_text: "Tôi hứng thú với việc thực hành ngoài thực địa, nghiên cứu đất đai, cây trồng hoặc vận hành thiết bị trắc địa.", order_index: 2, xp_reward: 25 },
    { code: "I1", dimension: "I", dimension_badge: "Nghiên cứu (Investigative)", domain_tag: "Toán & Thuật toán", icon_name: "Binary", question_text: "Tôi say mê tìm hiểu các bài toán tối ưu, câu đố logic hoặc nghiên cứu nguyên lý hoạt động của các mô hình AI.", order_index: 3, xp_reward: 25 },
    { code: "I2", dimension: "I", dimension_badge: "Nghiên cứu (Investigative)", domain_tag: "Khoa học Tự nhiên", icon_name: "Atom", question_text: "Tôi muốn tìm hiểu cội nguồn các hiện tượng tự nhiên và làm các thí nghiệm hóa sinh chuyên sâu.", order_index: 4, xp_reward: 25 },
    { code: "A1", dimension: "A", dimension_badge: "Nghệ thuật (Artistic)", domain_tag: "Thiết kế & Đồ họa", icon_name: "Palette", question_text: "Tôi có cảm hứng mạnh mẽ với việc phối màu, vẽ minh họa, dựng video hoặc thiết kế giao diện số UI/UX.", order_index: 5, xp_reward: 25 },
    { code: "A2", dimension: "A", dimension_badge: "Nghệ thuật (Artistic)", domain_tag: "Văn học & Nội dung", icon_name: "Feather", question_text: "Tôi thích sáng tác câu chuyện, viết kịch bản hoặc bày tỏ quan điểm cá nhân bằng ngôn từ sáng tạo tự do.", order_index: 6, xp_reward: 25 },
    { code: "S1", dimension: "S", dimension_badge: "Xã hội (Social)", domain_tag: "Giáo dục & Đào tạo", icon_name: "GraduationCap", question_text: "Tôi cảm thấy hạnh phúc khi hướng dẫn người khác hiểu một bài học khó hoặc truyền đạt kiến thức.", order_index: 7, xp_reward: 25 },
    { code: "S2", dimension: "S", dimension_badge: "Xã hội (Social)", domain_tag: "Y tế & Chăm sóc", icon_name: "HeartHandshake", question_text: "Tôi chủ động lắng nghe, đồng cảm và giúp bạn bè giải tỏa căng thẳng tâm lý.", order_index: 8, xp_reward: 25 },
    { code: "E1", dimension: "E", dimension_badge: "Quản lý (Enterprising)", domain_tag: "Khởi nghiệp & Quản trị", icon_name: "Briefcase", question_text: "Tôi tự tin dẫn dắt đội nhóm, phân công nhiệm vụ và thuyết phục người khác đồng thuận với kế hoạch của mình.", order_index: 9, xp_reward: 25 },
    { code: "E2", dimension: "E", dimension_badge: "Quản lý (Enterprising)", domain_tag: "Thương mại & Tiếp thị", icon_name: "TrendingUp", question_text: "Tôi thích tìm kiếm cơ hội kinh doanh, bán sản phẩm hoặc triển khai các chiến dịch truyền thông thu hút khách hàng.", order_index: 10, xp_reward: 25 },
    { code: "C1", dimension: "C", dimension_badge: "Nghiệp vụ (Conventional)", domain_tag: "Tài chính & Kế toán", icon_name: "Calculator", question_text: "Tôi thích kiểm tra các bảng biểu số liệu chi tiết, tính toán ngân sách và đảm bảo tính chính xác tuyệt đối.", order_index: 11, xp_reward: 25 },
    { code: "C2", dimension: "C", dimension_badge: "Nghiệp vụ (Conventional)", domain_tag: "Hồ sơ & Quy chuẩn", icon_name: "FileCheck", question_text: "Tôi sắp xếp tài liệu học tập, hồ sơ cá nhân ngăn nắp và luôn tuân thủ đúng thời hạn cùng quy trình đề ra.", order_index: 12, xp_reward: 25 }
  ],
  cognitive_questions: [
    {
      code: "COG_1",
      category: "COGNITIVE",
      dimension: "information_processing",
      dimension_badge: "Thiên hướng Xử lý Thông tin",
      domain_tag: "Thiên hướng Nhận thức & Phong cách Học tập",
      icon_name: "BrainCircuit",
      question_text: "Cách tiếp cận thông tin yêu thích: Bạn tiếp thu và ghi nhớ kiến thức mới hiệu quả nhất qua phương thức nào?",
      order_index: 1,
      xp_reward: 25,
      options: [
        { id: "opt_cog1_a", option_key: "A", trait_code: "COG_TRAIT_ANALYTICAL", title: "Phân tích Logic & Dữ liệu", description: "Đọc tài liệu chuyên sâu, phân tích sơ đồ luồng, thuật toán hoặc bảng số liệu khoa học.", related_moet_field_codes: ["46", "48", "72"], order_index: 1 },
        { id: "opt_cog1_b", option_key: "B", trait_code: "COG_TRAIT_VISUAL", title: "Trực quan & Hình ảnh", description: "Xem video mô phỏng, infographic, mindmap và các mô hình không gian 3 chiều trực quan.", related_moet_field_codes: ["21", "58"], order_index: 2 },
        { id: "opt_cog1_c", option_key: "C", trait_code: "COG_TRAIT_VERBAL", title: "Ngôn ngữ & Thảo luận", description: "Nghe giảng giải, tham gia tranh biện, đặt câu hỏi và đúc kết thành văn bản tóm tắt.", related_moet_field_codes: ["14", "22", "38"], order_index: 3 },
        { id: "opt_cog1_d", option_key: "D", trait_code: "COG_TRAIT_KINESTHETIC", title: "Thực hành & Trải nghiệm", description: "Tự tay làm thử, sửa lỗi sai thực tế, thao tác trực tiếp với công cụ hoặc thiết bị mẫu.", related_moet_field_codes: ["51", "52", "64"], order_index: 4 }
      ]
    },
    {
      code: "COG_2",
      category: "COGNITIVE",
      dimension: "learning_environment",
      dimension_badge: "Môi trường Học tập & Làm việc",
      domain_tag: "Thiên hướng Nhận thức & Phong cách Học tập",
      icon_name: "Users",
      question_text: "Môi trường làm việc lý tưởng: Không gian nào giúp bạn duy trì năng suất và trạng thái tập trung cao độ nhất?",
      order_index: 2,
      xp_reward: 25,
      options: [
        { id: "opt_cog2_a", option_key: "A", trait_code: "COG_TRAIT_INDEPENDENT", title: "Độc lập & Yên tĩnh", description: "Không gian riêng tư, ít bị gián đoạn, tự làm chủ tiến độ nghiên cứu của bản thân.", related_moet_field_codes: ["46", "48"], order_index: 1 },
        { id: "opt_cog2_b", option_key: "B", trait_code: "COG_TRAIT_COLLABORATIVE", title: "Hợp tác & Năng động", description: "Làm việc nhóm cùng đồng đội nhiệt huyết, thường xuyên trao đổi ý tưởng và hỗ trợ nhau.", related_moet_field_codes: ["34", "14"], order_index: 2 },
        { id: "opt_cog2_c", option_key: "C", trait_code: "COG_TRAIT_STRUCTURED", title: "Quy củ & Rõ ràng", description: "Có quy trình làm việc chuẩn hóa, phân công rành mạch, mục tiêu và thời hạn rõ ràng.", related_moet_field_codes: ["38", "34"], order_index: 3 },
        { id: "opt_cog2_d", option_key: "D", trait_code: "COG_TRAIT_EXPLORATORY", title: "Linh hoạt & Đổi mới", description: "Môi trường tự do sáng tạo, không gò bó theo giờ giấc hay khuôn mẫu có sẵn.", related_moet_field_codes: ["21", "48"], order_index: 4 }
      ]
    }
  ],
  qa_persona_presets: []
};
