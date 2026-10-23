import asyncio
import sys
import uuid
from pathlib import Path
from datetime import datetime, timezone

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.identity import User, UserRole, UserConsent
from app.models.taxonomy import (
    Major,
    SubjectBlock,
    MajorSubjectBlock,
    Career,
    Skill,
    SkillType,
    SkillPrerequisite,
    MajorSkill,
)
from app.models.roadmap import MajorRoadmap
from app.models.staging import StagingRecord, StagingStreamType, StagingStatus

# -------------------------------------------------------------------------
# 1. CATALOG OF LEVEL-IV MAJORS (THÔNG TƯ 09/2022/TT-BGDĐT) - 86 MAJORS
# -------------------------------------------------------------------------
MAJORS_DATA = [
    # 714 - Khoa học giáo dục và đào tạo giáo viên
    {
        "major_code": "7140201", "name": "Giáo dục Mầm non",
        "riasec": {"R": 0.1, "I": 0.3, "A": 0.6, "S": 0.9, "E": 0.3, "C": 0.4},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "low", "spatial_perception": "medium", "linguistic_ability": "high", "learning_environment": "collaborative", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Nhu cầu giáo viên mầm non đạt chuẩn cử nhân tăng cao theo Luật Giáo dục mới.",
        "blocks": ["M00", "C00", "D01"], "careers": ["Giáo viên Mầm non trường công lập/quốc tế", "Chuyên viên tư vấn tâm lý phát triển trẻ thơ", "Quản lý cơ sở giáo dục mầm non"]
    },
    {
        "major_code": "7140202", "name": "Giáo dục Tiểu học",
        "riasec": {"R": 0.1, "I": 0.4, "A": 0.5, "S": 0.9, "E": 0.4, "C": 0.5},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "medium", "spatial_perception": "medium", "linguistic_ability": "high", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Thiếu hụt giáo viên tiểu học tại các đô thị lớn và khu công nghiệp.",
        "blocks": ["D01", "C00", "A00"], "careers": ["Giáo viên Tiểu học", "Chuyên viên biên soạn học liệu tiểu học", "Nghiên cứu viên sư phạm"]
    },
    {
        "major_code": "7140205", "name": "Giáo dục Chính trị",
        "riasec": {"R": 0.1, "I": 0.7, "A": 0.3, "S": 0.8, "E": 0.6, "C": 0.5},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Giảng dạy môn Kinh tế & Pháp luật trong chương trình GDPT 2018.",
        "blocks": ["C00", "D01", "C19"], "careers": ["Giáo viên Giáo dục kinh tế & pháp luật", "Chuyên viên công tác chính trị - tư tưởng", "Giảng viên lý luận chính trị"]
    },
    {
        "major_code": "7140206", "name": "Giáo dục Thể chất",
        "riasec": {"R": 0.8, "I": 0.2, "A": 0.3, "S": 0.7, "E": 0.5, "C": 0.3},
        "cognitive": {"abstract_thinking": "low", "analytical_reasoning": "medium", "spatial_perception": "high", "linguistic_ability": "medium", "learning_environment": "collaborative", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Phát triển mạnh mẽ phong trào rèn luyện sức khỏe học đường và thể thao cộng đồng.",
        "blocks": ["T00", "T01"], "careers": ["Giáo viên Thể dục trường học", "Huấn luyện viên thể thao học đường", "Chuyên viên tổ chức sự kiện thể thao"]
    },
    {
        "major_code": "7140209", "name": "Sư phạm Toán học",
        "riasec": {"R": 0.2, "I": 0.9, "A": 0.2, "S": 0.7, "E": 0.3, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Nhu cầu cao đối với giáo viên dạy chương trình Toán chuyên và song ngữ quốc tế.",
        "blocks": ["A00", "A01"], "careers": ["Giáo viên Toán THPT", "Chuyên viên phát triển chương trình Toán STEM", "Nghiên cứu viên phương pháp dạy học Toán"]
    },
    {
        "major_code": "7140210", "name": "Sư phạm Tin học",
        "riasec": {"R": 0.4, "I": 0.9, "A": 0.2, "S": 0.7, "E": 0.4, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Trọng tâm chuyển đổi số giáo dục và phổ cập môn Tin học từ lớp 3.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Giáo viên Tin học trường phổ thông", "Chuyên viên quản trị giải pháp EdTech", "Kỹ sư đào tạo lập trình cho trẻ em"]
    },
    {
        "major_code": "7140211", "name": "Sư phạm Vật lí",
        "riasec": {"R": 0.4, "I": 0.9, "A": 0.2, "S": 0.7, "E": 0.3, "C": 0.5},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Tích hợp giảng dạy bộ môn Khoa học tự nhiên và các chuyên đề Vật lý ứng dụng.",
        "blocks": ["A00", "A01"], "careers": ["Giáo viên Vật lí THPT", "Cán bộ nghiên cứu thí nghiệm khoa học", "Chuyên gia giáo dục STEM"]
    },
    {
        "major_code": "7140212", "name": "Sư phạm Hóa học",
        "riasec": {"R": 0.4, "I": 0.9, "A": 0.2, "S": 0.7, "E": 0.3, "C": 0.5},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Giảng dạy Hóa học thực nghiệm và Khoa học tự nhiên đổi mới sáng tạo.",
        "blocks": ["A00", "B00", "D07"], "careers": ["Giáo viên Hóa học THPT", "Chuyên viên phòng thí nghiệm phân tích", "Chuyên viên biên soạn sách giáo khoa"]
    },
    {
        "major_code": "7140213", "name": "Sư phạm Sinh học",
        "riasec": {"R": 0.3, "I": 0.9, "A": 0.2, "S": 0.7, "E": 0.3, "C": 0.5},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Nhu cầu nghiên cứu sinh thái học và giảng dạy công nghệ sinh học ứng dụng.",
        "blocks": ["B00", "A02", "D08"], "careers": ["Giáo viên Sinh học THPT", "Nghiên cứu viên công nghệ sinh học giáo dục", "Chuyên viên bảo tồn sinh thái học đường"]
    },
    {
        "major_code": "7140217", "name": "Sư phạm Ngữ văn",
        "riasec": {"R": 0.1, "I": 0.7, "A": 0.8, "S": 0.8, "E": 0.4, "C": 0.4},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "medium", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "exploratory", "teamwork_intensity": "balanced"},
        "outlook": "Môn học bắt buộc cốt lõi trong toàn bộ hệ thống giáo dục quốc dân.",
        "blocks": ["C00", "D01", "D14"], "careers": ["Giáo viên Ngữ văn THPT", "Biên tập viên nhà xuất bản giáo dục", "Chuyên viên truyền thông văn hóa"]
    },
    {
        "major_code": "7140218", "name": "Sư phạm Lịch sử",
        "riasec": {"R": 0.1, "I": 0.8, "A": 0.4, "S": 0.8, "E": 0.4, "C": 0.5},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Môn học bắt buộc ở bậc THPT; nhu cầu đổi mới phương pháp giảng dạy sử học.",
        "blocks": ["C00", "D01", "D14"], "careers": ["Giáo viên Lịch sử THPT", "Chuyên viên bảo tàng - di tích", "Nghiên cứu viên lịch sử văn hóa"]
    },
    {
        "major_code": "7140219", "name": "Sư phạm Địa lí",
        "riasec": {"R": 0.3, "I": 0.8, "A": 0.3, "S": 0.7, "E": 0.4, "C": 0.5},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Tích hợp dữ liệu GIS, biến đổi khí hậu và địa lý kinh tế xã hội.",
        "blocks": ["C00", "A00", "D01"], "careers": ["Giáo viên Địa lí THPT", "Chuyên viên bản đồ và dữ liệu GIS", "Nghiên cứu viên quy hoạch không gian"]
    },
    {
        "major_code": "7140231", "name": "Sư phạm Tiếng Anh",
        "riasec": {"R": 0.1, "I": 0.5, "A": 0.5, "S": 0.9, "E": 0.5, "C": 0.5},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "medium", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "collaborative", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Nhu cầu tuyển dụng rất lớn ở mọi cấp học, trung tâm ngoại ngữ và trường quốc tế.",
        "blocks": ["D01", "D14"], "careers": ["Giáo viên Tiếng Anh phổ thông/quốc tế", "Giảng viên luyện thi chứng chỉ IELTS/TOEFL", "Chuyên gia phát triển chương trình ngoại ngữ"]
    },

    # 721 - Nghệ thuật
    {
        "major_code": "7210403", "name": "Thiết kế đồ họa",
        "riasec": {"R": 0.3, "I": 0.3, "A": 0.9, "S": 0.3, "E": 0.5, "C": 0.4},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "medium", "spatial_perception": "high", "linguistic_ability": "medium", "learning_environment": "exploratory", "teamwork_intensity": "balanced"},
        "outlook": "Bùng nổ ngành công nghiệp sáng tạo nội dung, UI/UX và truyền thông thị giác.",
        "blocks": ["H00", "V00", "D01"], "careers": ["Chuyên viên Thiết kế đồ họa (Graphic Designer)", "Thiết kế giao diện người dùng (UI/UX Designer)", "Giám đốc nghệ thuật (Art Director)"]
    },
    {
        "major_code": "7210404", "name": "Thiết kế thời trang",
        "riasec": {"R": 0.4, "I": 0.2, "A": 0.9, "S": 0.3, "E": 0.6, "C": 0.3},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "medium", "spatial_perception": "high", "linguistic_ability": "medium", "learning_environment": "exploratory", "teamwork_intensity": "balanced"},
        "outlook": "Ngành dệt may chuyển dịch mạnh sang thiết kế thương hiệu nội địa và xuất khẩu.",
        "blocks": ["H00", "V00", "D01"], "careers": ["Nhà thiết kế thời trang (Fashion Designer)", "Stylist tạo mẫu phong cách", "Quản lý sản xuất thời trang"]
    },
    {
        "major_code": "7210405", "name": "Thiết kế công nghiệp",
        "riasec": {"R": 0.6, "I": 0.5, "A": 0.8, "S": 0.2, "E": 0.4, "C": 0.4},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Sản xuất phần cứng tiêu dùng, xe điện và thiết bị thông minh tăng cao.",
        "blocks": ["H00", "V00", "A01"], "careers": ["Nhà thiết kế kiểu dáng sản phẩm (Product Designer)", "Chuyên viên tạo mẫu 3D công nghiệp", "Kỹ sư nghiên cứu phát triển mẫu mã R&D"]
    },

    # 722 - Nhân văn
    {
        "major_code": "7220101", "name": "Tiếng Việt và văn hóa Việt Nam",
        "riasec": {"R": 0.1, "I": 0.7, "A": 0.6, "S": 0.8, "E": 0.3, "C": 0.4},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "medium", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "exploratory", "teamwork_intensity": "balanced"},
        "outlook": "Giảng dạy tiếng Việt cho người nước ngoài và bảo tồn di sản văn hóa số.",
        "blocks": ["C00", "D01"], "careers": ["Giảng viên dạy tiếng Việt cho người nước ngoài", "Chuyên viên quản lý di sản văn hóa", "Biên tập viên nội dung văn hóa"]
    },
    {
        "major_code": "7220201", "name": "Ngôn ngữ Anh",
        "riasec": {"R": 0.1, "I": 0.4, "A": 0.5, "S": 0.8, "E": 0.6, "C": 0.5},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "medium", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "collaborative", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Ngôn ngữ giao thương toàn cầu; biên dịch công nghệ, ngoại giao và đối ngoại.",
        "blocks": ["D01", "A01", "D14"], "careers": ["Biên - Phiên dịch viên tiếng Anh", "Chuyên viên đối ngoại & quan hệ quốc tế", "Chuyên viên truyền thông đa văn hóa"]
    },
    {
        "major_code": "7220204", "name": "Ngôn ngữ Trung Quốc",
        "riasec": {"R": 0.1, "I": 0.4, "A": 0.4, "S": 0.7, "E": 0.7, "C": 0.5},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "medium", "spatial_perception": "medium", "linguistic_ability": "high", "learning_environment": "collaborative", "teamwork_intensity": "balanced"},
        "outlook": "Làn sóng FDI từ các tập đoàn công nghệ và chuỗi cung ứng Trung Quốc.",
        "blocks": ["D01", "D04", "C00"], "careers": ["Biên phiên dịch tiếng Trung", "Chuyên viên mua hàng chuỗi cung ứng quốc tế", "Quản lý kinh doanh thị trường Hoa ngữ"]
    },
    {
        "major_code": "7220209", "name": "Ngôn ngữ Nhật",
        "riasec": {"R": 0.1, "I": 0.5, "A": 0.4, "S": 0.6, "E": 0.6, "C": 0.7},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Cầu nối kỹ thuật CNTT (Bridge SE) và hợp tác công nghiệp Việt - Nhật.",
        "blocks": ["D01", "D06", "C00"], "careers": ["Kỹ sư cầu nối tiếng Nhật (BrSE)", "Biên dịch viên kỹ thuật Nhật ngữ", "Chuyên viên nhân sự doanh nghiệp Nhật"]
    },
    {
        "major_code": "7220210", "name": "Ngôn ngữ Hàn Quốc",
        "riasec": {"R": 0.1, "I": 0.4, "A": 0.5, "S": 0.7, "E": 0.6, "C": 0.5},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "medium", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "collaborative", "teamwork_intensity": "balanced"},
        "outlook": "Các tập đoàn hàng đầu Hàn Quốc đầu tư mở rộng R&D và sản xuất tại Việt Nam.",
        "blocks": ["D01", "D05", "C00"], "careers": ["Chuyên viên đối ngoại tiếng Hàn", "Biên phiên dịch hội nghị Hàn - Việt", "Điều phối viên dự án FDI Hàn Quốc"]
    },

    # 731 - Khoa học xã hội và hành vi
    {
        "major_code": "7310101", "name": "Kinh tế",
        "riasec": {"R": 0.1, "I": 0.8, "A": 0.2, "S": 0.4, "E": 0.7, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Nhu cầu phân tích kinh tế vĩ mô, chính sách công và dữ liệu kinh tế lượng.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Chuyên viên phân tích kinh tế", "Cố vấn chính sách công", "Chuyên viên phân tích dữ liệu thị trường"]
    },
    {
        "major_code": "7310102", "name": "Kinh tế phát triển",
        "riasec": {"R": 0.1, "I": 0.8, "A": 0.2, "S": 0.6, "E": 0.6, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Phát triển bền vững, kinh tế tuần hoàn và các dự án viện trợ quốc tế (NGO).",
        "blocks": ["A00", "A01", "D01"], "careers": ["Quản lý dự án phát triển cộng đồng", "Chuyên viên thẩm định dự án đầu tư công", "Nghiên cứu viên kinh tế xã hội"]
    },
    {
        "major_code": "7310104", "name": "Kinh tế quốc tế",
        "riasec": {"R": 0.1, "I": 0.7, "A": 0.2, "S": 0.5, "E": 0.8, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Hội nhập thương mại tự do qua các hiệp định thế hệ mới (CPTPP, EVFTA).",
        "blocks": ["A01", "D01", "A00"], "careers": ["Chuyên viên đàm phán thương mại quốc tế", "Phân tích rủi ro đầu tư xuyên biên giới", "Chuyên viên xuất nhập khẩu"]
    },
    {
        "major_code": "7310201", "name": "Xã hội học",
        "riasec": {"R": 0.1, "I": 0.8, "A": 0.3, "S": 0.8, "E": 0.4, "C": 0.5},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "exploratory", "teamwork_intensity": "balanced"},
        "outlook": "Đánh giá tác động xã hội cho các dự án đô thị và chuyển đổi số.",
        "blocks": ["C00", "D01", "A01"], "careers": ["Nghiên cứu viên xã hội học", "Chuyên viên điều tra dư luận xã hội", "Chuyên viên công tác xã hội doanh nghiệp (CSR)"]
    },
    {
        "major_code": "7310301", "name": "Tâm lý học",
        "riasec": {"R": 0.1, "I": 0.8, "A": 0.4, "S": 0.9, "E": 0.4, "C": 0.4},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "exploratory", "teamwork_intensity": "balanced"},
        "outlook": "Nhu cầu chăm sóc sức khỏe tinh thần và tham vấn tâm lý học đường bùng nổ.",
        "blocks": ["B00", "C00", "D01"], "careers": ["Chuyên viên tham vấn tâm lý học đường", "Chuyên viên tâm lý trị liệu", "Chuyên gia tâm lý nhân sự và hành vi người dùng"]
    },
    {
        "major_code": "7310401", "name": "Quốc tế học",
        "riasec": {"R": 0.1, "I": 0.7, "A": 0.3, "S": 0.7, "E": 0.7, "C": 0.5},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "collaborative", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Mở rộng ngoại giao song phương, đa phương và tổ chức quốc tế phi chính phủ.",
        "blocks": ["D01", "C00", "A01"], "careers": ["Chuyên viên ngoại giao", "Cán bộ dự án tổ chức quốc tế", "Phóng viên/Bình luận viên quốc tế"]
    },

    # 732 - Báo chí và thông tin
    {
        "major_code": "7320101", "name": "Báo chí",
        "riasec": {"R": 0.2, "I": 0.7, "A": 0.7, "S": 0.7, "E": 0.6, "C": 0.4},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "medium", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "exploratory", "teamwork_intensity": "balanced"},
        "outlook": "Chuyển đổi số báo chí dữ liệu, tòa soạn hội tụ và kiểm chứng thông tin.",
        "blocks": ["C00", "D01", "D14"], "careers": ["Phóng viên/Nhà báo số", "Biên tập viên tòa soạn đa phương tiện", "Chuyên viên phân tích tin tức"]
    },
    {
        "major_code": "7320104", "name": "Truyền thông đa phương tiện",
        "riasec": {"R": 0.3, "I": 0.4, "A": 0.8, "S": 0.6, "E": 0.6, "C": 0.4},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "medium", "spatial_perception": "high", "linguistic_ability": "high", "learning_environment": "exploratory", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Sản xuất video ngắn, nội dung số đa nền tảng và tương tác thực tế ảo.",
        "blocks": ["A01", "D01", "C00"], "careers": ["Nhà sản xuất nội dung số (Content Producer)", "Chuyên viên kỹ xảo và dựng phim", "Quản lý chiến dịch truyền thông số"]
    },
    {
        "major_code": "7320106", "name": "Quan hệ công chúng",
        "riasec": {"R": 0.1, "I": 0.4, "A": 0.6, "S": 0.8, "E": 0.8, "C": 0.4},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "medium", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "collaborative", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Xây dựng thương hiệu tổ chức và quản trị khủng hoảng truyền thông hiện đại.",
        "blocks": ["D01", "C00", "A01"], "careers": ["Chuyên viên Quan hệ công chúng (PR Specialist)", "Quản lý xử trị khủng hoảng truyền thông", "Chuyên viên tổ chức sự kiện doanh nghiệp"]
    },
    {
        "major_code": "7320201", "name": "Thông tin - Thư viện",
        "riasec": {"R": 0.1, "I": 0.6, "A": 0.2, "S": 0.6, "E": 0.3, "C": 0.8},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Quản trị thư viện số, lưu trữ tri thức và siêu dữ liệu cho hệ thống số hóa.",
        "blocks": ["C00", "D01", "A00"], "careers": ["Chuyên viên thư viện số", "Chuyên viên phân loại siêu dữ liệu", "Quản trị viên kho lưu trữ tri thức"]
    },

    # 734 - Kinh doanh và quản lý
    {
        "major_code": "7340101", "name": "Quản trị kinh doanh",
        "riasec": {"R": 0.2, "I": 0.5, "A": 0.3, "S": 0.6, "E": 0.9, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "collaborative", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Khởi nghiệp sáng tạo và quản trị vận hành doanh nghiệp thời đại số.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Nhà sáng lập / Giám đốc điều hành (CEO)", "Chuyên viên phát triển kinh doanh", "Cố vấn chiến lược quản trị"]
    },
    {
        "major_code": "7340115", "name": "Marketing",
        "riasec": {"R": 0.1, "I": 0.5, "A": 0.7, "S": 0.6, "E": 0.9, "C": 0.5},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "high", "learning_environment": "exploratory", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Marketing dựa trên dữ liệu (Growth Hacking, MarTech) và phân tích hành vi tiêu dùng.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Chuyên viên Tiếp thị kỹ thuật số (Digital Marketer)", "Quản lý nhãn hàng (Brand Manager)", "Chuyên viên nghiên cứu thị trường"]
    },
    {
        "major_code": "7340116", "name": "Bất động sản",
        "riasec": {"R": 0.3, "I": 0.5, "A": 0.2, "S": 0.6, "E": 0.9, "C": 0.6},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "high", "learning_environment": "collaborative", "teamwork_intensity": "balanced"},
        "outlook": "Phát triển hạ tầng đô thị, bất động sản công nghiệp và dịch vụ tài chính địa ốc.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Chuyên viên thẩm định giá bất động sản", "Quản lý sàn giao dịch và dự án địa ốc", "Cố vấn đầu tư bất động sản"]
    },
    {
        "major_code": "7340120", "name": "Kinh doanh quốc tế",
        "riasec": {"R": 0.1, "I": 0.6, "A": 0.3, "S": 0.6, "E": 0.9, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "collaborative", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Thương mại xuyên biên giới và quản trị chuỗi cung ứng quốc tế.",
        "blocks": ["A01", "D01", "A00"], "careers": ["Chuyên viên phát triển thị trường quốc tế", "Quản lý xuất nhập khẩu", "Chuyên viên thu mua hàng hóa toàn cầu"]
    },
    {
        "major_code": "7340121", "name": "Kinh doanh thương mại",
        "riasec": {"R": 0.2, "I": 0.5, "A": 0.2, "S": 0.6, "E": 0.9, "C": 0.6},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "medium", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "collaborative", "teamwork_intensity": "balanced"},
        "outlook": "Tối ưu hóa kênh bán lẻ hiện đại (Omnichannel) và chuỗi cửa hàng tiện lợi.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Quản lý chuỗi bán lẻ", "Chuyên viên phân phối và trưng bày hàng hóa", "Chuyên viên quản lý ngành hàng (Category Manager)"]
    },
    {
        "major_code": "7340122", "name": "Thương mại điện tử",
        "riasec": {"R": 0.3, "I": 0.6, "A": 0.4, "S": 0.5, "E": 0.8, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Thị trường bán lẻ trực tuyến tại Việt Nam duy trì tốc độ tăng trưởng trên 20%/năm.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Quản lý vận hành sàn thương mại điện tử", "Chuyên viên tối ưu hóa trải nghiệm mua sắm", "Chuyên viên phân tích dữ liệu bán hàng online"]
    },
    {
        "major_code": "7340201", "name": "Tài chính - Ngân hàng",
        "riasec": {"R": 0.1, "I": 0.7, "A": 0.1, "S": 0.4, "E": 0.8, "C": 0.8},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Hiện đại hóa hệ thống ngân hàng số, ngân hàng bán lẻ và quản lý tài sản.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Chuyên viên phân tích tín dụng ngân hàng", "Chuyên viên tư vấn quản lý tài sản", "Chuyên viên thẩm định đầu tư"]
    },
    {
        "major_code": "7340204", "name": "Bảo hiểm",
        "riasec": {"R": 0.1, "I": 0.7, "A": 0.1, "S": 0.5, "E": 0.7, "C": 0.8},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Định phí bảo hiểm (Actuary) và số hóa quy trình bồi thường bảo hiểm nhân thọ/phi nhân thọ.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Chuyên gia định phí bảo hiểm (Actuary)", "Chuyên viên thẩm định và bồi thường bảo hiểm", "Cố vấn quản lý rủi ro tài chính"]
    },
    {
        "major_code": "7340205", "name": "Công nghệ tài chính (Fintech)",
        "riasec": {"R": 0.4, "I": 0.8, "A": 0.2, "S": 0.3, "E": 0.8, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Sự giao thoa giữa AI, Blockchain, thanh toán điện tử và ngân hàng mở.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Kỹ sư giải pháp Fintech", "Chuyên viên phát triển sản phẩm thanh toán số", "Chuyên gia phân tích dữ liệu tài chính thuật toán"]
    },
    {
        "major_code": "7340301", "name": "Kế toán",
        "riasec": {"R": 0.1, "I": 0.6, "A": 0.1, "S": 0.3, "E": 0.5, "C": 0.9},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Chuẩn mực kế toán quốc tế IFRS và tự động hóa ghi nhận giao dịch bằng phần mềm.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Kế toán tổng hợp", "Kế toán quản trị", "Chuyên viên tư vấn thuế doanh nghiệp"]
    },
    {
        "major_code": "7340302", "name": "Kiểm toán",
        "riasec": {"R": 0.1, "I": 0.7, "A": 0.1, "S": 0.3, "E": 0.6, "C": 0.9},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Yêu cầu minh bạch tài chính doanh nghiệp niêm yết theo chuẩn mực quốc tế.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Kiểm toán viên nội bộ", "Kiểm toán viên độc lập tại Big 4", "Chuyên viên kiểm soát tuân thủ"]
    },
    {
        "major_code": "7340404", "name": "Quản trị nhân lực",
        "riasec": {"R": 0.1, "I": 0.5, "A": 0.3, "S": 0.8, "E": 0.8, "C": 0.6},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "medium", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "collaborative", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Thu hút nhân tài công nghệ và chuyển đổi quản trị nhân sự theo mô hình People Analytics.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Chuyên viên tuyển dụng nhân tài (Talent Acquisition)", "Chuyên viên đào tạo & phát triển (L&D)", "Giám đốc nhân sự (HR Manager)"]
    },
    {
        "major_code": "7340405", "name": "Hệ thống thông tin quản lý",
        "riasec": {"R": 0.3, "I": 0.8, "A": 0.2, "S": 0.4, "E": 0.7, "C": 0.8},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Cầu nối giữa khối công nghệ và nghiệp vụ quản trị trong hệ thống ERP doanh nghiệp.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Chuyên viên phân tích nghiệp vụ (Business Analyst)", "Chuyên viên triển khai ERP", "Quản trị cơ sở dữ liệu doanh nghiệp"]
    },

    # 738 - Pháp luật
    {
        "major_code": "7380101", "name": "Luật",
        "riasec": {"R": 0.1, "I": 0.8, "A": 0.2, "S": 0.7, "E": 0.7, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Hoàn thiện nhà nước pháp quyền và cải cách tư pháp toàn diện.",
        "blocks": ["C00", "D01", "A00"], "careers": ["Luật sư tranh tụng", "Thẩm phán / Kiểm sát viên", "Chuyên viên pháp chế cơ quan nhà nước"]
    },
    {
        "major_code": "7380107", "name": "Luật kinh tế",
        "riasec": {"R": 0.1, "I": 0.8, "A": 0.2, "S": 0.5, "E": 0.8, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Tư vấn sáp nhập doanh nghiệp (M&A), sở hữu trí tuệ và tranh chấp thương mại.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Chuyên viên pháp chế doanh nghiệp (In-house Counsel)", "Luật sư tư vấn hợp đồng thương mại", "Trọng tài viên thương mại"]
    },
    {
        "major_code": "7380108", "name": "Luật quốc tế",
        "riasec": {"R": 0.1, "I": 0.8, "A": 0.2, "S": 0.6, "E": 0.8, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "high", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Giải quyết tranh chấp đầu tư quốc tế và thực thi các cam kết công ước toàn cầu.",
        "blocks": ["D01", "A01", "C00"], "careers": ["Cố vấn pháp lý quốc tế", "Chuyên viên tranh chấp thương mại xuyên biên giới", "Cán bộ ngoại giao pháp lý"]
    },

    # 742 - Khoa học sự sống
    {
        "major_code": "7420101", "name": "Sinh học",
        "riasec": {"R": 0.4, "I": 0.9, "A": 0.2, "S": 0.3, "E": 0.2, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Nghiên cứu cơ bản về hệ gen, di truyền phân tử và đa dạng sinh học.",
        "blocks": ["B00", "A02", "D08"], "careers": ["Nhà nghiên cứu sinh học cơ bản", "Chuyên viên kiểm nghiệm vi sinh", "Chuyên gia bảo tồn tài nguyên sinh vật"]
    },
    {
        "major_code": "7420201", "name": "Công nghệ sinh học",
        "riasec": {"R": 0.5, "I": 0.9, "A": 0.2, "S": 0.3, "E": 0.4, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Ứng dụng trong y dược học, vaccine thế hệ mới, nông nghiệp chính xác và xử lý môi trường.",
        "blocks": ["B00", "A00", "D07"], "careers": ["Kỹ sư công nghệ sinh học", "Chuyên viên nghiên cứu R&D dược phẩm sinh học", "Kỹ sư nuôi cấy mô tế bào"]
    },

    # 744 - Khoa học tự nhiên
    {
        "major_code": "7440102", "name": "Vật lý học",
        "riasec": {"R": 0.5, "I": 0.9, "A": 0.2, "S": 0.2, "E": 0.2, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Nghiên cứu vật liệu bán dẫn, quang tử và năng lượng mới.",
        "blocks": ["A00", "A01"], "careers": ["Nghiên cứu viên vật lý", "Kỹ sư quang học và đo lường", "Chuyên gia vật lý bán dẫn"]
    },
    {
        "major_code": "7440112", "name": "Hóa học",
        "riasec": {"R": 0.5, "I": 0.9, "A": 0.2, "S": 0.2, "E": 0.3, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Nghiên cứu hóa dược, vật liệu polymer sinh học và hóa học xanh.",
        "blocks": ["A00", "B00", "D07"], "careers": ["Chuyên viên phân tích hóa học phòng thí nghiệm", "Kỹ sư phát triển sản phẩm hóa mỹ phẩm", "Nghiên cứu viên hóa dược"]
    },
    {
        "major_code": "7440301", "name": "Khoa học môi trường",
        "riasec": {"R": 0.5, "I": 0.8, "A": 0.2, "S": 0.6, "E": 0.4, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Cam kết phát thải ròng bằng 0 (Net Zero 2050) và thị trường tín chỉ carbon.",
        "blocks": ["A00", "B00", "D07"], "careers": ["Chuyên gia đánh giá tác động môi trường (EIA)", "Chuyên viên kiểm kê khí nhà kính", "Cố vấn phát triển bền vững"]
    },

    # 746 - Toán và thống kê
    {
        "major_code": "7460101", "name": "Toán học",
        "riasec": {"R": 0.1, "I": 0.9, "A": 0.3, "S": 0.2, "E": 0.2, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Nền tảng của mật mã học, tối ưu hóa thuật toán và bảo mật lượng tử.",
        "blocks": ["A00", "A01"], "careers": ["Nhà toán học nghiên cứu", "Chuyên viên mật mã bảo mật", "Chuyên gia mô hình hóa toán học"]
    },
    {
        "major_code": "7460108", "name": "Khoa học dữ liệu",
        "riasec": {"R": 0.3, "I": 0.9, "A": 0.2, "S": 0.3, "E": 0.5, "C": 0.8},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Nhu cầu hàng đầu trong kỷ nguyên Big Data và trí tuệ nhân tạo toàn cầu.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Kỹ sư khoa học dữ liệu (Data Scientist)", "Chuyên viên phân tích dữ liệu kinh doanh", "Kỹ sư xử lý dữ liệu lớn (Big Data Engineer)"]
    },
    {
        "major_code": "7460112", "name": "Toán ứng dụng",
        "riasec": {"R": 0.2, "I": 0.9, "A": 0.2, "S": 0.2, "E": 0.4, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Ứng dụng trong định lượng tài chính, mô phỏng cơ học và kỹ thuật mô phỏng.",
        "blocks": ["A00", "A01"], "careers": ["Chuyên gia tài chính định lượng (Quant)", "Kỹ sư mô phỏng kỹ thuật", "Chuyên viên giải thuật số học"]
    },
    {
        "major_code": "7460201", "name": "Thống kê",
        "riasec": {"R": 0.1, "I": 0.9, "A": 0.1, "S": 0.3, "E": 0.4, "C": 0.9},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Phục vụ điều tra quốc gia, y học chứng cứ và kiểm định chất lượng sản phẩm.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Chuyên viên thống kê xã hội", "Chuyên viên thống kê sinh học y tế", "Chuyên viên kiểm định chất lượng số liệu"]
    },

    # 748 - Máy tính và công nghệ thông tin
    {
        "major_code": "7480101", "name": "Khoa học máy tính",
        "riasec": {"R": 0.4, "I": 0.9, "A": 0.3, "S": 0.2, "E": 0.4, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Trọng tâm nghiên cứu lõi về thuật toán, tính toán đám mây và hệ thống phân tán.",
        "blocks": ["A00", "A01"], "careers": ["Nhà nghiên cứu khoa học máy tính", "Kiến trúc sư hệ thống phần mềm", "Kỹ sư tối ưu hóa giải thuật"]
    },
    {
        "major_code": "7480102", "name": "Mạng máy tính và truyền thông dữ liệu",
        "riasec": {"R": 0.6, "I": 0.8, "A": 0.1, "S": 0.3, "E": 0.4, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Mạng 5G, truyền thông vệ tinh thế hệ mới và trung tâm dữ liệu siêu quy mô.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư hạ tầng mạng viễn thông", "Quản trị viên hệ thống đám mây (Cloud Admin)", "Kỹ sư vận hành trung tâm dữ liệu"]
    },
    {
        "major_code": "7480103", "name": "Kỹ thuật phần mềm",
        "riasec": {"R": 0.4, "I": 0.9, "A": 0.3, "S": 0.3, "E": 0.5, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Lực lượng nòng cốt phát triển ứng dụng di động, hệ thống web và giải pháp SaaS.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Kỹ sư phần mềm Fullstack", "Kỹ sư kiểm thử phần mềm tự động (QA/QC)", "Quản lý dự án phát triển phần mềm (Scrum Master)"]
    },
    {
        "major_code": "7480104", "name": "Hệ thống thông tin",
        "riasec": {"R": 0.3, "I": 0.8, "A": 0.2, "S": 0.4, "E": 0.6, "C": 0.8},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Xây dựng hạ tầng cơ sở dữ liệu quốc gia và giải pháp tích hợp phần mềm doanh nghiệp.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Kiến trúc sư cơ sở dữ liệu", "Chuyên viên phân tích hệ thống thông tin", "Quản trị viên dữ liệu doanh nghiệp"]
    },
    {
        "major_code": "7480108", "name": "Trí tuệ nhân tạo",
        "riasec": {"R": 0.4, "I": 0.9, "A": 0.3, "S": 0.2, "E": 0.5, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Lĩnh vực công nghệ đột phá toàn cầu; phát triển mô hình sinh (Generative AI) và thị giác máy tính.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư Trí tuệ nhân tạo (AI Engineer)", "Kỹ sư học máy (Machine Learning Engineer)", "Nghiên cứu viên mô hình ngôn ngữ lớn (LLM Researcher)"]
    },
    {
        "major_code": "7480201", "name": "Công nghệ thông tin",
        "riasec": {"R": 0.5, "I": 0.9, "A": 0.3, "S": 0.3, "E": 0.5, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Ngành đào tạo chủ lực phục vụ chương trình Chuyển đổi số Quốc gia đến năm 2030.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Kỹ sư phát triển phần mềm Backend", "Kỹ sư vận hành DevOps / SRE", "Chuyên viên giải pháp CNTT doanh nghiệp"]
    },
    {
        "major_code": "7480202", "name": "An toàn thông tin",
        "riasec": {"R": 0.5, "I": 0.9, "A": 0.2, "S": 0.3, "E": 0.4, "C": 0.8},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Bảo vệ hệ thống tài chính, dữ liệu cá nhân theo Luật An ninh mạng và Luật 91/2025/QH15.",
        "blocks": ["A00", "A01"], "careers": ["Chuyên viên phân tích an ninh mạng (SOC Analyst)", "Kỹ sư kiểm thử thâm nhập (Penetration Tester)", "Chuyên gia điều tra tội phạm mạng (Digital Forensics)"]
    },

    # 751 - Công nghệ kỹ thuật
    {
        "major_code": "7510102", "name": "Công nghệ kỹ thuật kiến trúc",
        "riasec": {"R": 0.7, "I": 0.6, "A": 0.7, "S": 0.2, "E": 0.4, "C": 0.5},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Ứng dụng mô hình thông tin công trình (BIM) và kiến trúc số xanh.",
        "blocks": ["A00", "A01", "V00"], "careers": ["Kỹ sư điều phối BIM kiến trúc", "Chuyên viên thiết kế thi công công trình", "Chuyên viên giám sát kỹ thuật kiến trúc"]
    },
    {
        "major_code": "7510201", "name": "Công nghệ kỹ thuật cơ khí",
        "riasec": {"R": 0.9, "I": 0.7, "A": 0.2, "S": 0.1, "E": 0.3, "C": 0.6},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Gia công cơ khí chính xác CNC và chế tạo máy móc tự động hóa sản xuất.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư lập trình và vận hành máy CNC", "Kỹ sư thiết kế cơ khí chế tạo máy", "Quản đốc phân xưởng cơ khí"]
    },
    {
        "major_code": "7510203", "name": "Công nghệ kỹ thuật cơ điện tử",
        "riasec": {"R": 0.8, "I": 0.8, "A": 0.2, "S": 0.2, "E": 0.4, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Sự kết hợp giữa cơ khí, điện tử và lập trình điều khiển cho robot công nghiệp.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư Robot và Cơ điện tử", "Kỹ sư tích hợp hệ thống tự động", "Chuyên viên bảo trì thiết bị công nghệ cao"]
    },
    {
        "major_code": "7510205", "name": "Công nghệ kỹ thuật ô tô",
        "riasec": {"R": 0.9, "I": 0.7, "A": 0.2, "S": 0.2, "E": 0.4, "C": 0.5},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Chuyển dịch thần tốc sang xe điện (EV), pin năng lượng và xe tự hành.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư hệ thống ô tô điện (EV Engineer)", "Kỹ sư chẩn đoán và kiểm định kỹ thuật ô tô", "Giám đốc dịch vụ đại lý ô tô"]
    },
    {
        "major_code": "7510301", "name": "Công nghệ kỹ thuật điện, điện tử",
        "riasec": {"R": 0.8, "I": 0.8, "A": 0.1, "S": 0.2, "E": 0.3, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Lưới điện thông minh (Smart Grid), năng lượng tái tạo và thiết bị điện tử gia dụng.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư thiết kế hệ thống điện", "Kỹ sư kiểm tra chất lượng linh kiện điện tử", "Kỹ sư vận hành trạm biến áp và nguồn điện"]
    },
    {
        "major_code": "7510302", "name": "Công nghệ kỹ thuật điện tử - viễn thông",
        "riasec": {"R": 0.7, "I": 0.8, "A": 0.1, "S": 0.2, "E": 0.3, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Hạ tầng trạm phát sóng 5G, thiết bị IoT và thiết kế vi mạch bán dẫn.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư thiết kế vi mạch bán dẫn", "Kỹ sư tối ưu hóa mạng viễn thông", "Kỹ sư phần cứng thiết bị IoT"]
    },
    {
        "major_code": "7510303", "name": "Công nghệ kỹ thuật điều khiển và tự động hóa",
        "riasec": {"R": 0.8, "I": 0.8, "A": 0.1, "S": 0.2, "E": 0.4, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Nhà máy thông minh (Smart Factory), hệ thống PLC và dây chuyền tự động hóa toàn phần.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư lập trình điều khiển PLC/SCADA", "Kỹ sư tự động hóa dây chuyền sản xuất", "Chuyên viên tích hợp giải pháp Industry 4.0"]
    },
    {
        "major_code": "7510401", "name": "Công nghệ kỹ thuật hóa học",
        "riasec": {"R": 0.7, "I": 0.8, "A": 0.1, "S": 0.2, "E": 0.3, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Lọc hóa dầu, công nghệ pin lithium và sản xuất nguyên liệu công nghiệp.",
        "blocks": ["A00", "B00", "D07"], "careers": ["Kỹ sư vận hành nhà máy hóa chất", "Kỹ sư nghiên cứu công nghệ vật liệu mới", "Chuyên viên kiểm soát an toàn hóa chất"]
    },
    {
        "major_code": "7510406", "name": "Công nghệ kỹ thuật môi trường",
        "riasec": {"R": 0.7, "I": 0.8, "A": 0.1, "S": 0.5, "E": 0.3, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Xử lý nước thải công nghiệp, quản lý chất thải rắn và tuần hoàn tài nguyên.",
        "blocks": ["A00", "B00", "D07"], "careers": ["Kỹ sư thiết kế hệ thống xử lý nước thải", "Chuyên viên quan trắc môi trường", "Kỹ sư an toàn môi trường doanh nghiệp"]
    },
    {
        "major_code": "7510605", "name": "Logistics và Quản lý chuỗi cung ứng",
        "riasec": {"R": 0.4, "I": 0.7, "A": 0.2, "S": 0.4, "E": 0.8, "C": 0.8},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Việt Nam giữ vị thế trung tâm vận chuyển hàng hải và hàng không khu vực Đông Nam Á.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Chuyên viên điều phối chuỗi cung ứng", "Quản lý trung tâm kho vận thông minh", "Chuyên viên forwarder và giao nhận vận tải"]
    },

    # 752 - Kỹ thuật
    {
        "major_code": "7520114", "name": "Kỹ thuật cơ điện tử",
        "riasec": {"R": 0.8, "I": 0.9, "A": 0.2, "S": 0.2, "E": 0.4, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Chế tạo thiết bị bay không người lái (UAV), tay máy phẫu thuật và công nghệ Robot.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư nghiên cứu và phát triển Robot", "Kỹ sư hệ thống nhúng cơ điện tử", "Chuyên viên giải pháp tự động hóa"]
    },
    {
        "major_code": "7520115", "name": "Kỹ thuật nhiệt",
        "riasec": {"R": 0.8, "I": 0.7, "A": 0.1, "S": 0.2, "E": 0.3, "C": 0.6},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Hệ thống điều hòa trung tâm HVAC, lò hơi công nghiệp và năng lượng nhiệt sạch.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư thiết kế hệ thống HVAC", "Kỹ sư vận hành nhà máy nhiệt điện", "Chuyên viên kiểm toán năng lượng nhiệt"]
    },
    {
        "major_code": "7520120", "name": "Kỹ thuật hàng không",
        "riasec": {"R": 0.8, "I": 0.9, "A": 0.2, "S": 0.2, "E": 0.4, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Bảo dưỡng sửa chữa máy bay (MRO) tại các sân bay lớn Long Thành, Nội Bài.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư bảo dưỡng tàu bay", "Kỹ sư khí động lực học", "Chuyên viên quản lý an toàn bay"]
    },
    {
        "major_code": "7520130", "name": "Kỹ thuật ô tô",
        "riasec": {"R": 0.9, "I": 0.8, "A": 0.2, "S": 0.2, "E": 0.4, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Nghiên cứu khung gầm, hệ truyền động điện và phần mềm điều khiển ô tô thông minh.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư thiết kế ô tô", "Kỹ sư phần mềm nhúng ô tô (Automotive Embedded)", "Chuyên viên thử nghiệm khí thải và an toàn"]
    },
    {
        "major_code": "7520201", "name": "Kỹ thuật điện",
        "riasec": {"R": 0.8, "I": 0.8, "A": 0.1, "S": 0.2, "E": 0.3, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Quy hoạch điện VIII, truyền tải điện cao thế siêu dẫn và tích hợp điện gió, điện mặt trời.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư điện lưới quốc gia", "Kỹ sư năng lượng tái tạo", "Chuyên gia phân tích hệ thống điện"]
    },
    {
        "major_code": "7520207", "name": "Kỹ thuật điện tử - viễn thông",
        "riasec": {"R": 0.7, "I": 0.9, "A": 0.2, "S": 0.2, "E": 0.3, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Sản xuất thiết bị truyền dẫn vệ tinh, thiết kế chip bán dẫn và radar dân sự.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư thiết kế layout vi mạch", "Kỹ sư viễn thông không dây", "Kỹ sư nghiên cứu xử lý tín hiệu số"]
    },
    {
        "major_code": "7520216", "name": "Kỹ thuật điều khiển và tự động hóa",
        "riasec": {"R": 0.8, "I": 0.9, "A": 0.1, "S": 0.2, "E": 0.4, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Hệ thống điều khiển phân tán (DCS) cho dầu khí, hóa chất và cảng biển tự động.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư hệ thống DCS", "Chuyên gia tự động hóa cảng biển", "Kiến trúc sư giải pháp nhà máy thông minh"]
    },
    {
        "major_code": "7520301", "name": "Kỹ thuật hóa học",
        "riasec": {"R": 0.7, "I": 0.8, "A": 0.1, "S": 0.2, "E": 0.3, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Thiết kế thiết bị phản ứng hóa học, công nghệ lọc tách và xúc tác nano.",
        "blocks": ["A00", "B00", "D07"], "careers": ["Kỹ sư thiết kế quy trình hóa học (Process Engineer)", "Kỹ sư vận hành tháp chưng cất", "Chuyên gia an toàn hóa chất công nghiệp"]
    },
    {
        "major_code": "7520320", "name": "Kỹ thuật vật liệu",
        "riasec": {"R": 0.7, "I": 0.9, "A": 0.2, "S": 0.1, "E": 0.3, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Phát triển vật liệu bán dẫn SiC, GaN, sợi carbon composite và hợp kim siêu nhẹ.",
        "blocks": ["A00", "A01", "B00"], "careers": ["Kỹ sư vật liệu bán dẫn", "Kỹ sư nghiên cứu composite", "Chuyên viên kiểm định cơ lý vật liệu"]
    },

    # 754 - Sản xuất và chế biến
    {
        "major_code": "7540101", "name": "Công nghệ thực phẩm",
        "riasec": {"R": 0.6, "I": 0.8, "A": 0.2, "S": 0.3, "E": 0.4, "C": 0.7},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Chế biến sâu nông sản xuất khẩu, bao bì thông minh và thực phẩm chức năng.",
        "blocks": ["A00", "B00", "D07"], "careers": ["Kỹ sư phát triển sản phẩm thực phẩm (R&D)", "Quản lý chất lượng thực phẩm (QA/QC)", "Giám sát viên quy trình chế biến thực phẩm"]
    },
    {
        "major_code": "7540106", "name": "Đảm bảo chất lượng và an toàn thực phẩm",
        "riasec": {"R": 0.5, "I": 0.8, "A": 0.1, "S": 0.4, "E": 0.4, "C": 0.8},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Tuân thủ nghiêm ngặt tiêu chuẩn HACCP, ISO 22000 và FDA xuất khẩu.",
        "blocks": ["A00", "B00", "D07"], "careers": ["Chuyên viên kiểm soát tuân thủ an toàn thực phẩm", "Thanh tra viên an toàn thực phẩm", "Chuyên viên đánh giá chứng nhận ISO"]
    },

    # 758 - Kiến trúc và xây dựng
    {
        "major_code": "7580101", "name": "Kiến trúc",
        "riasec": {"R": 0.6, "I": 0.7, "A": 0.9, "S": 0.3, "E": 0.5, "C": 0.5},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "medium", "learning_environment": "exploratory", "teamwork_intensity": "balanced"},
        "outlook": "Quy hoạch đô thị bền vững, công trình xanh đạt chứng chỉ LEED và LOTUS.",
        "blocks": ["V00", "V01", "A01"], "careers": ["Kiến trúc sư chủ trì thiết kế công trình", "Kiến trúc sư nội thất", "Cố vấn công trình kiến trúc xanh"]
    },
    {
        "major_code": "7580102", "name": "Kiến trúc cảnh quan",
        "riasec": {"R": 0.6, "I": 0.6, "A": 0.8, "S": 0.4, "E": 0.4, "C": 0.5},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "medium", "spatial_perception": "high", "linguistic_ability": "medium", "learning_environment": "exploratory", "teamwork_intensity": "balanced"},
        "outlook": "Thiết kế công viên sinh thái, khu nghỉ dưỡng và cảnh quan đô thị ven sông.",
        "blocks": ["V00", "V01", "A00"], "careers": ["Kiến trúc sư cảnh quan", "Quy hoạch viên không gian công cộng", "Quản lý thi công cảnh quan sinh thái"]
    },
    {
        "major_code": "7580105", "name": "Quy hoạch vùng và đô thị",
        "riasec": {"R": 0.4, "I": 0.8, "A": 0.6, "S": 0.5, "E": 0.6, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Chiến lược phân vùng phát triển kinh tế vùng và phát triển đô thị thông minh.",
        "blocks": ["A00", "A01", "V00"], "careers": ["Chuyên viên quy hoạch đô thị", "Cố vấn phát triển hạ tầng vùng", "Chuyên viên phân tích dữ liệu không gian GIS"]
    },
    {
        "major_code": "7580201", "name": "Kỹ thuật xây dựng",
        "riasec": {"R": 0.9, "I": 0.7, "A": 0.2, "S": 0.2, "E": 0.4, "C": 0.6},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Xây dựng hạ tầng cao tốc, cảng biển và các tòa nhà chọc trời.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư thiết kế kết cấu xây dựng", "Chỉ huy trưởng công trường xây dựng", "Kỹ sư giám sát thi công"]
    },
    {
        "major_code": "7580205", "name": "Kỹ thuật xây dựng công trình giao thông",
        "riasec": {"R": 0.9, "I": 0.7, "A": 0.1, "S": 0.2, "E": 0.4, "C": 0.6},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Các đại dự án đường sắt đô thị Metro, đường sắt tốc độ cao Bắc - Nam và cầu vượt biển.",
        "blocks": ["A00", "A01"], "careers": ["Kỹ sư thiết kế cầu đường", "Kỹ sư thi công công trình ngầm", "Chuyên viên quản lý dự án giao thông"]
    },
    {
        "major_code": "7580301", "name": "Quản lý xây dựng",
        "riasec": {"R": 0.6, "I": 0.7, "A": 0.2, "S": 0.4, "E": 0.8, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Quản lý tiến độ, chi phí và đấu thầu các dự án hạ tầng quy mô tỷ USD.",
        "blocks": ["A00", "A01", "D01"], "careers": ["Kỹ sư dự toán và quản lý chi phí (QS Engineer)", "Quản lý dự án xây dựng (Project Manager)", "Chuyên viên quản lý hợp đồng đấu thầu"]
    },

    # 762 - Nông, lâm nghiệp và thủy sản
    {
        "major_code": "7620101", "name": "Nông nghiệp",
        "riasec": {"R": 0.8, "I": 0.7, "A": 0.1, "S": 0.4, "E": 0.4, "C": 0.5},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Nông nghiệp hữu cơ, tự động hóa tưới tiêu và sản xuất theo chuỗi giá trị.",
        "blocks": ["B00", "A00", "D08"], "careers": ["Kỹ sư nông nghiệp công nghệ cao", "Quản lý nông trường hữu cơ", "Chuyên viên tư vấn khuyến nông"]
    },
    {
        "major_code": "7620105", "name": "Cây trồng",
        "riasec": {"R": 0.8, "I": 0.7, "A": 0.1, "S": 0.3, "E": 0.3, "C": 0.5},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Chọn tạo giống cây kháng sâu bệnh và thích ứng với xâm nhập mặn.",
        "blocks": ["B00", "A00", "D08"], "careers": ["Kỹ sư chọn tạo giống cây trồng", "Chuyên viên sinh lý dinh dưỡng thực vật", "Quản lý vườn ươm giống chất lượng cao"]
    },
    {
        "major_code": "7620110", "name": "Bảo vệ thực vật",
        "riasec": {"R": 0.7, "I": 0.8, "A": 0.1, "S": 0.3, "E": 0.3, "C": 0.6},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Kiểm dịch thực vật tại cửa khẩu và phát triển thuốc bảo vệ thực vật sinh học.",
        "blocks": ["B00", "A00", "D08"], "careers": ["Chuyên viên kiểm dịch thực vật quốc tế", "Kỹ sư quản lý dịch hại tổng hợp (IPM)", "Nghiên cứu viên chế phẩm sinh học"]
    },
    {
        "major_code": "7620201", "name": "Lâm học",
        "riasec": {"R": 0.9, "I": 0.6, "A": 0.2, "S": 0.3, "E": 0.2, "C": 0.5},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "medium", "spatial_perception": "high", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Quản lý rừng bền vững được cấp chứng chỉ FSC và thương mại hóa tín chỉ carbon rừng.",
        "blocks": ["B00", "A00", "D08"], "careers": ["Cán bộ kiểm lâm quản lý rừng", "Chuyên gia phát triển tín chỉ carbon rừng", "Kỹ sư phục hồi hệ sinh thái rừng"]
    },
    {
        "major_code": "7620301", "name": "Nuôi trồng thủy sản",
        "riasec": {"R": 0.8, "I": 0.7, "A": 0.1, "S": 0.3, "E": 0.4, "C": 0.5},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Ứng dụng nuôi tôm công nghệ cao siêu thâm canh và nuôi biển xa bờ.",
        "blocks": ["B00", "A00", "D08"], "careers": ["Kỹ sư nuôi trồng thủy sản công nghệ cao", "Chuyên viên quản lý dịch bệnh thủy sản", "Chuyên gia tư vấn thức ăn thủy sản"]
    },

    # 764 - Thú y
    {
        "major_code": "7640101", "name": "Thú y",
        "riasec": {"R": 0.8, "I": 0.8, "A": 0.1, "S": 0.5, "E": 0.4, "C": 0.6},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Bùng nổ dịch vụ chăm sóc thú cưng tại đô thị và an toàn dịch bệnh chăn nuôi trang trại lớn.",
        "blocks": ["B00", "A02", "D08"], "careers": ["Bác sĩ thú y lâm sàng phòng khám thú cưng", "Chuyên gia kiểm soát dịch tễ trang trại", "Nghiên cứu viên phát triển vaccine thú y"]
    },

    # 772 - Sức khỏe
    {
        "major_code": "7720101", "name": "Y khoa",
        "riasec": {"R": 0.5, "I": 0.9, "A": 0.2, "S": 0.9, "E": 0.4, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Y học chính xác, phẫu thuật nội soi robot và nhu cầu bác sĩ chuyên khoa sâu.",
        "blocks": ["B00"], "careers": ["Bác sĩ Đa khoa tại bệnh viện tuyến tỉnh/trung ương", "Bác sĩ Chuyên khoa sâu (Ngoại, Nội, Nhi)", "Bác sĩ Cấp cứu và hồi sức tích cực"]
    },
    {
        "major_code": "7720115", "name": "Y học cổ truyền",
        "riasec": {"R": 0.4, "I": 0.8, "A": 0.3, "S": 0.9, "E": 0.3, "C": 0.6},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Kết hợp Đông - Tây y trong phục hồi chức năng và chăm sóc sức khỏe mạn tính.",
        "blocks": ["B00"], "careers": ["Bác sĩ Y học cổ truyền", "Chuyên gia châm cứu và dưỡng sinh", "Thầy thuốc tư vấn y học phục hồi"]
    },
    {
        "major_code": "7720116", "name": "Y học dự phòng",
        "riasec": {"R": 0.3, "I": 0.9, "A": 0.1, "S": 0.8, "E": 0.4, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "low", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Kiểm soát dịch bệnh truyền nhiễm toàn cầu, tiêm chủng và dịch tễ học thực địa.",
        "blocks": ["B00"], "careers": ["Bác sĩ Dịch tễ học CDC", "Chuyên viên giám sát bệnh truyền nhiễm", "Bác sĩ y tế công cộng học đường"]
    },
    {
        "major_code": "7720201", "name": "Dược học",
        "riasec": {"R": 0.4, "I": 0.9, "A": 0.1, "S": 0.6, "E": 0.6, "C": 0.8},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Nghiên cứu thử nghiệm lâm sàng, dược lâm sàng bệnh viện và phân phối dược phẩm.",
        "blocks": ["A00", "B00"], "careers": ["Dược sĩ Lâm sàng bệnh viện", "Dược sĩ nghiên cứu phát triển thuốc (R&D)", "Quản lý kinh doanh dược phẩm"]
    },
    {
        "major_code": "7720301", "name": "Điều dưỡng",
        "riasec": {"R": 0.4, "I": 0.6, "A": 0.2, "S": 0.9, "E": 0.3, "C": 0.7},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "medium", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Thiếu hụt điều dưỡng viên chuyên nghiệp tại Việt Nam và cơ hội làm việc tại Nhật, Đức.",
        "blocks": ["B00"], "careers": ["Điều dưỡng viên tại bệnh viện", "Điều dưỡng trưởng khoa", "Chuyên viên chăm sóc y tế tại gia"]
    },
    {
        "major_code": "7720501", "name": "Răng - Hàm - Mặt",
        "riasec": {"R": 0.7, "I": 0.8, "A": 0.4, "S": 0.8, "E": 0.5, "C": 0.7},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "high", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Nhu cầu chỉnh nha, cấy ghép implant nha khoa thẩm mỹ phát triển rất nhanh.",
        "blocks": ["B00"], "careers": ["Bác sĩ Răng - Hàm - Mặt", "Bác sĩ Chỉnh nha thẩm mỹ", "Phẫu thuật viên nha khoa"]
    },
    {
        "major_code": "7720601", "name": "Kỹ thuật xét nghiệm y học",
        "riasec": {"R": 0.6, "I": 0.8, "A": 0.1, "S": 0.4, "E": 0.2, "C": 0.8},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "low", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Xét nghiệm sinh học phân tử, chẩn đoán gen sớm và tự động hóa phòng lab y tế.",
        "blocks": ["B00", "A00"], "careers": ["Kỹ thuật viên xét nghiệm y khoa", "Quản lý phòng xét nghiệm sinh hóa", "Chuyên viên xét nghiệm di truyền học"]
    },

    # 781 - Du lịch, khách sạn, thể thao và dịch vụ cá nhân
    {
        "major_code": "7810101", "name": "Du lịch",
        "riasec": {"R": 0.2, "I": 0.5, "A": 0.4, "S": 0.8, "E": 0.8, "C": 0.5},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "medium", "spatial_perception": "medium", "linguistic_ability": "high", "learning_environment": "collaborative", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Du lịch sinh thái, phát triển điểm đến thông minh và di sản văn hóa.",
        "blocks": ["D01", "C00", "A01"], "careers": ["Chuyên viên phát triển sản phẩm du lịch", "Chuyên viên quản lý điểm đến", "Nhà nghiên cứu kinh tế du lịch"]
    },
    {
        "major_code": "7810103", "name": "Quản trị dịch vụ du lịch và lữ hành",
        "riasec": {"R": 0.3, "I": 0.4, "A": 0.4, "S": 0.8, "E": 0.8, "C": 0.6},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "medium", "spatial_perception": "medium", "linguistic_ability": "high", "learning_environment": "collaborative", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Tổ chức tour du lịch quốc tế, thiết kế hành trình trải nghiệm cá nhân hóa.",
        "blocks": ["D01", "C00", "A01"], "careers": ["Hướng dẫn viên du lịch quốc tế", "Giám đốc điều hành tour (Tour Operator)", "Chuyên viên bán vé và đại lý du lịch"]
    },
    {
        "major_code": "7810201", "name": "Quản trị khách sạn",
        "riasec": {"R": 0.3, "I": 0.4, "A": 0.4, "S": 0.8, "E": 0.8, "C": 0.7},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "medium", "spatial_perception": "medium", "linguistic_ability": "high", "learning_environment": "collaborative", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Sự hiện diện của các tập đoàn quản lý khách sạn 5 sao toàn cầu tại Việt Nam.",
        "blocks": ["D01", "A01", "C00"], "careers": ["Tổng giám đốc khách sạn (General Manager)", "Quản lý bộ phận tiền sảnh (Front Office Manager)", "Giám đốc kinh doanh và tiếp thị khách sạn"]
    },
    {
        "major_code": "7810202", "name": "Quản trị nhà hàng và dịch vụ ăn uống",
        "riasec": {"R": 0.5, "I": 0.3, "A": 0.5, "S": 0.7, "E": 0.8, "C": 0.6},
        "cognitive": {"abstract_thinking": "medium", "analytical_reasoning": "medium", "spatial_perception": "medium", "linguistic_ability": "high", "learning_environment": "collaborative", "teamwork_intensity": "highly_collaborative"},
        "outlook": "Công nghiệp F&B phát triển với chuỗi ẩm thực cao cấp và tiêu chuẩn ẩm thực Michelin.",
        "blocks": ["D01", "A01", "C00"], "careers": ["Quản lý nhà hàng cao cấp (Restaurant Manager)", "Giám đốc ẩm thực (F&B Director)", "Chuyên gia phát triển thực đơn và trải nghiệm ẩm thực"]
    },

    # 785 - Môi trường và bảo vệ môi trường
    {
        "major_code": "7850101", "name": "Quản lý tài nguyên và môi trường",
        "riasec": {"R": 0.6, "I": 0.8, "A": 0.2, "S": 0.6, "E": 0.5, "C": 0.7},
        "cognitive": {"abstract_thinking": "high", "analytical_reasoning": "high", "spatial_perception": "medium", "linguistic_ability": "medium", "learning_environment": "structured", "teamwork_intensity": "balanced"},
        "outlook": "Thực thi chính sách ESG (Môi trường - Xã hội - Quản trị) bắt buộc đối với doanh nghiệp niêm yết.",
        "blocks": ["A00", "B00", "A01"], "careers": ["Chuyên viên quản lý tài nguyên đất đai và khoáng sản", "Cố vấn tuân thủ ESG doanh nghiệp", "Cán bộ quản lý môi trường tại Sở TN&MT"]
    }
]

# -------------------------------------------------------------------------
# 2. ADMISSION SUBJECT BLOCKS WITH NATIONAL STATS (MU, SIGMA)
# -------------------------------------------------------------------------
SUBJECT_BLOCKS_DATA = [
    {"block_code": "A00", "name": "Toán, Vật lí, Hóa học", "subjects": ["Toán", "Vật lí", "Hóa học"], "national_mean": 20.85, "national_std": 3.25},
    {"block_code": "A01", "name": "Toán, Vật lí, Tiếng Anh", "subjects": ["Toán", "Vật lí", "Tiếng Anh"], "national_mean": 20.15, "national_std": 3.10},
    {"block_code": "B00", "name": "Toán, Hóa học, Sinh học", "subjects": ["Toán", "Hóa học", "Sinh học"], "national_mean": 19.80, "national_std": 3.40},
    {"block_code": "C00", "name": "Ngữ văn, Lịch sử, Địa lí", "subjects": ["Ngữ văn", "Lịch sử", "Địa lí"], "national_mean": 21.50, "national_std": 3.35},
    {"block_code": "D01", "name": "Toán, Ngữ văn, Tiếng Anh", "subjects": ["Toán", "Ngữ văn", "Tiếng Anh"], "national_mean": 19.20, "national_std": 3.15},
    {"block_code": "D07", "name": "Toán, Hóa học, Tiếng Anh", "subjects": ["Toán", "Hóa học", "Tiếng Anh"], "national_mean": 20.40, "national_std": 3.20},
    {"block_code": "D08", "name": "Toán, Sinh học, Tiếng Anh", "subjects": ["Toán", "Sinh học", "Tiếng Anh"], "national_mean": 19.90, "national_std": 3.30},
    {"block_code": "A02", "name": "Toán, Vật lí, Sinh học", "subjects": ["Toán", "Vật lí", "Sinh học"], "national_mean": 19.50, "national_std": 3.20},
    {"block_code": "D14", "name": "Ngữ văn, Lịch sử, Tiếng Anh", "subjects": ["Ngữ văn", "Lịch sử", "Tiếng Anh"], "national_mean": 20.50, "national_std": 3.25},
    {"block_code": "H00", "name": "Ngữ văn, Hình họa mỹ thuật, Bố cục màu", "subjects": ["Ngữ văn", "Hình họa mỹ thuật", "Bố cục màu"], "national_mean": 21.00, "national_std": 3.00},
    {"block_code": "V00", "name": "Toán, Vật lí, Vẽ mỹ thuật", "subjects": ["Toán", "Vật lí", "Vẽ mỹ thuật"], "national_mean": 20.50, "national_std": 3.00},
]

# -------------------------------------------------------------------------
# 3. SKILL TAXONOMY (PREREQUISITE & TARGET)
# -------------------------------------------------------------------------
SKILLS_DATA = [
    # PREREQUISITE SKILLS
    {"skill_code": "SKILL_PRE_CALCULUS", "name": "Giải tích và Đại số tuyến tính căn bản", "skill_type": SkillType.PREREQUISITE, "domain": "Toán học", "desc": "Giới hạn, đạo hàm, tích phân và ma trận đại số"},
    {"skill_code": "SKILL_PRE_PHYSICS_MECH", "name": "Vật lý đại cương: Cơ - Nhiệt - Điện", "skill_type": SkillType.PREREQUISITE, "domain": "Khoa học tự nhiên", "desc": "Các định luật bảo toàn và nguyên lý tĩnh điện"},
    {"skill_code": "SKILL_PRE_CHEM_GEN", "name": "Hóa học đại cương và vô cơ", "skill_type": SkillType.PREREQUISITE, "domain": "Khoa học tự nhiên", "desc": "Cấu tạo nguyên tử, liên kết hóa học và phản ứng oxy hóa khử"},
    {"skill_code": "SKILL_PRE_BIO_CELL", "name": "Sinh học tế bào và di truyền học", "skill_type": SkillType.PREREQUISITE, "domain": "Khoa học tự nhiên", "desc": "Cấu trúc DNA, phiên mã, dịch mã và quy luật di truyền"},
    {"skill_code": "SKILL_PRE_LOGIC_DISCRETE", "name": "Tư duy logic hình thức & Toán rời rạc", "skill_type": SkillType.PREREQUISITE, "domain": "Tư duy logic", "desc": "Mệnh đề, tập hợp, đồ thị và suy luận quy nạp"},
    {"skill_code": "SKILL_PRE_ENG_ACADEMIC", "name": "Tiếng Anh học thuật & đọc hiểu tài liệu", "skill_type": SkillType.PREREQUISITE, "domain": "Ngoại ngữ", "desc": "Kỹ năng tra cứu và đọc hiểu giáo trình chuyên ngành tiếng Anh"},
    {"skill_code": "SKILL_PRE_VIET_ESSAY", "name": "Kỹ năng viết luận và phân tích văn bản", "skill_type": SkillType.PREREQUISITE, "domain": "Nhân văn", "desc": "Lập luận logic, bố cục bài viết và trích dẫn chuẩn mực"},
    {"skill_code": "SKILL_PRE_STAT_BASIC", "name": "Xác suất thống kê ứng dụng", "skill_type": SkillType.PREREQUISITE, "domain": "Toán học", "desc": "Biến ngẫu nhiên, phân phối chuẩn và kiểm định giả thuyết"},

    # TARGET SKILLS
    {"skill_code": "SKILL_TAR_PROG_PYTHON", "name": "Lập trình và cấu trúc dữ liệu với Python", "skill_type": SkillType.TARGET, "domain": "Công nghệ thông tin", "desc": "Lập trình hướng đối tượng, xử lý danh sách, cây và đồ thị"},
    {"skill_code": "SKILL_TAR_ALGORITHMS", "name": "Thiết kế và tối ưu thuật toán máy tính", "skill_type": SkillType.TARGET, "domain": "Công nghệ thông tin", "desc": "Quy hoạch động, chia để trị và thuật toán tìm kiếm"},
    {"skill_code": "SKILL_TAR_DATA_MODELING", "name": "Mô hình hóa dữ liệu quan hệ và phi quan hệ", "skill_type": SkillType.TARGET, "domain": "Công nghệ thông tin", "desc": "Thiết kế lược đồ ERD, truy vấn SQL và chuẩn hóa dữ liệu"},
    {"skill_code": "SKILL_TAR_AI_MACHINE_LEARNING", "name": "Học máy và mô hình trí tuệ nhân tạo", "skill_type": SkillType.TARGET, "domain": "Trí tuệ nhân tạo", "desc": "Hồi quy, phân lớp, mạng nơ-ron và đánh giá mô hình ML"},
    {"skill_code": "SKILL_TAR_CIRCUIT_DESIGN", "name": "Thiết kế mạch điện tử và vi điều khiển", "skill_type": SkillType.TARGET, "domain": "Kỹ thuật", "desc": "Lập trình nhúng Arduino, STM32 và thiết kế PCB"},
    {"skill_code": "SKILL_TAR_FINANCIAL_ANALYSIS", "name": "Phân tích tài chính và định giá doanh nghiệp", "skill_type": SkillType.TARGET, "domain": "Kinh tế - Tài chính", "desc": "Phân tích báo cáo tài chính, mô hình chiết khấu dòng tiền DCF"},
    {"skill_code": "SKILL_TAR_DIGITAL_MARKETING", "name": "Tiếp thị số và tối ưu hóa chuyển đổi", "skill_type": SkillType.TARGET, "domain": "Kinh doanh", "desc": "SEO, Google Ads, Meta Ads và phân tích hành vi khách hàng"},
    {"skill_code": "SKILL_TAR_LEGAL_CONTRACT", "name": "Soạn thảo văn bản pháp lý và tư vấn hợp đồng", "skill_type": SkillType.TARGET, "domain": "Pháp luật", "desc": "Kỹ năng rà soát điều khoản rủi ro và đàm phán hợp đồng thương mại"},
    {"skill_code": "SKILL_TAR_CLINICAL_DIAGNOSIS", "name": "Khám bệnh và chẩn đoán lâm sàng", "skill_type": SkillType.TARGET, "domain": "Y khoa", "desc": "Quy trình hỏi bệnh sử, khám thực thể và diễn giải cận lâm sàng"},
    {"skill_code": "SKILL_TAR_ARCH_CAD_BIM", "name": "Mô hình hóa kiến trúc và công trình CAD/BIM", "skill_type": SkillType.TARGET, "domain": "Kiến trúc", "desc": "Dựng hình 3D Revit, AutoCAD và bóc tách khối lượng công trình"},
    {"skill_code": "SKILL_TAR_SUPPLY_CHAIN", "name": "Hoạch định chuỗi cung ứng và điều phối vận tải", "skill_type": SkillType.TARGET, "domain": "Logistics", "desc": "Quản lý tồn kho EOQ, định tuyến giao hàng và nghiệp vụ hải quan"}
]


async def seed_data():
    print("=" * 70)
    print("STARTING SEEDING PROCESS: THÔNG TƯ 09/2022/TT-BGDĐT CATALOG")
    print("=" * 70)

    async with AsyncSessionLocal() as session:
        # 1. Create Default Users (Argon2id Compliant)
        print("1. Seeding default accounts (Admin & Student)...")
        admin_email = "admin@aicareerguide.edu.vn"
        student_email = "student@aicareerguide.edu.vn"

        admin_res = await session.execute(select(User).where(User.email == admin_email))
        admin_user = admin_res.scalar_one_or_none()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                hashed_password=get_password_hash("AdminPass2026@ASVS"),
                full_name="Quản trị viên Kiểm duyệt (Admin)",
                role=UserRole.ADMIN,
                is_active=True
            )
            session.add(admin_user)
            await session.commit()
            await session.refresh(admin_user)
            print(f"   Created Admin user: {admin_email}")

        student_res = await session.execute(select(User).where(User.email == student_email))
        student_user = student_res.scalar_one_or_none()
        if not student_user:
            student_user = User(
                email=student_email,
                hashed_password=get_password_hash("StudentPass2026@OWASP"),
                full_name="Học sinh Trải nghiệm (Grade 12)",
                role=UserRole.STUDENT,
                is_active=True
            )
            session.add(student_user)
            await session.commit()
            await session.refresh(student_user)
            print(f"   Created Student user: {student_email}")

            # Consent record under Law 91/2025/QH15
            consent = UserConsent(
                user_id=student_user.id,
                consent_type="INITIAL_ONBOARDING_TERMS_LAW91_2025",
                policy_version="v1.0-Law91/2025/QH15",
                is_granted=True,
                granted_at=datetime.now(timezone.utc)
            )
            session.add(consent)
            await session.commit()

        # 2. Seed Subject Blocks
        print("2. Seeding admission subject blocks with national Z-score parameters...")
        block_cache = {}
        for block_data in SUBJECT_BLOCKS_DATA:
            res = await session.execute(select(SubjectBlock).where(SubjectBlock.block_code == block_data["block_code"]))
            sb = res.scalar_one_or_none()
            if not sb:
                sb = SubjectBlock(
                    block_code=block_data["block_code"],
                    name=block_data["name"],
                    subjects=block_data["subjects"],
                    national_mean=block_data["national_mean"],
                    national_std=block_data["national_std"]
                )
                session.add(sb)
                await session.commit()
                await session.refresh(sb)
            block_cache[block_data["block_code"]] = sb
        print(f"   Seeded {len(block_cache)} subject blocks.")

        # 3. Seed Skills
        print("3. Seeding skill taxonomies and prerequisite linkages...")
        skill_cache = {}
        for s_data in SKILLS_DATA:
            res = await session.execute(select(Skill).where(Skill.skill_code == s_data["skill_code"]))
            sk = res.scalar_one_or_none()
            if not sk:
                sk = Skill(
                    skill_code=s_data["skill_code"],
                    name=s_data["name"],
                    skill_type=s_data["skill_type"],
                    domain=s_data["domain"],
                    description=s_data["desc"]
                )
                session.add(sk)
                await session.commit()
                await session.refresh(sk)
            skill_cache[s_data["skill_code"]] = sk
        print(f"   Seeded {len(skill_cache)} skills.")

        # Prerequisite link: Python requires Discrete Logic
        if "SKILL_TAR_PROG_PYTHON" in skill_cache and "SKILL_PRE_LOGIC_DISCRETE" in skill_cache:
            p_res = await session.execute(
                select(SkillPrerequisite).where(
                    SkillPrerequisite.skill_id == skill_cache["SKILL_TAR_PROG_PYTHON"].id,
                    SkillPrerequisite.prerequisite_skill_id == skill_cache["SKILL_PRE_LOGIC_DISCRETE"].id
                )
            )
            if not p_res.scalar_one_or_none():
                sp = SkillPrerequisite(
                    skill_id=skill_cache["SKILL_TAR_PROG_PYTHON"].id,
                    prerequisite_skill_id=skill_cache["SKILL_PRE_LOGIC_DISCRETE"].id
                )
                session.add(sp)
                await session.commit()

        # 4. Seed Level-IV Majors (Thông tư 09/2022/TT-BGDĐT)
        print(f"4. Seeding {len(MAJORS_DATA)} Level-IV MOET majors, careers, and links...")
        seeded_majors_count = 0
        for m_data in MAJORS_DATA:
            res = await session.execute(select(Major).where(Major.major_code == m_data["major_code"]))
            major = res.scalar_one_or_none()
            if not major:
                major = Major(
                    major_code=m_data["major_code"],
                    name=m_data["name"],
                    degree_level="Đại học",
                    riasec_vector=m_data["riasec"],
                    cognitive_attributes=m_data["cognitive"],
                    industry_outlook=m_data["outlook"],
                    description=f"Ngành đào tạo trình độ đại học theo Thông tư 09/2022/TT-BGDĐT: {m_data['name']}",
                    is_active=True
                )
                session.add(major)
                await session.commit()
                await session.refresh(major)
                seeded_majors_count += 1

                # Link subject blocks
                for b_code in m_data.get("blocks", []):
                    if b_code in block_cache:
                        msb = MajorSubjectBlock(
                            major_id=major.id,
                            subject_block_id=block_cache[b_code].id,
                            weight=1.0
                        )
                        session.add(msb)

                # Link careers based on Phoenix Ho Career Tree Model
                for c_title in m_data.get("careers", []):
                    career = Career(
                        major_id=major.id,
                        title=c_title,
                        career_tree_level="Lá - Nghề nghiệp cụ thể",
                        description=f"Vị trí công việc thực tế trong thị trường lao động thuộc ngành {major.name}",
                        responsibilities=[
                            "Thực hiện các nghiệp vụ chuyên môn theo chuẩn chức danh",
                            "Ứng dụng công nghệ và công cụ ngành trong quy trình công việc",
                            "Phối hợp liên bộ phận và báo cáo kết quả định kỳ"
                        ]
                    )
                    session.add(career)

                # Link sample mandatory skill
                if "7480" in major.major_code or "7460" in major.major_code:
                    if "SKILL_TAR_PROG_PYTHON" in skill_cache:
                        session.add(MajorSkill(major_id=major.id, skill_id=skill_cache["SKILL_TAR_PROG_PYTHON"].id, importance_level="MANDATORY"))
                elif "7340" in major.major_code:
                    if "SKILL_TAR_FINANCIAL_ANALYSIS" in skill_cache:
                        session.add(MajorSkill(major_id=major.id, skill_id=skill_cache["SKILL_TAR_FINANCIAL_ANALYSIS"].id, importance_level="MANDATORY"))
                elif "7720" in major.major_code:
                    if "SKILL_TAR_CLINICAL_DIAGNOSIS" in skill_cache:
                        session.add(MajorSkill(major_id=major.id, skill_id=skill_cache["SKILL_TAR_CLINICAL_DIAGNOSIS"].id, importance_level="MANDATORY"))

                await session.commit()

        print(f"   Successfully processed and seeded {seeded_majors_count} new majors (Total catalog: {len(MAJORS_DATA)}).")

        # 5. Seed Pre-cached Roadmap in major_roadmaps (Stream B cache)
        print("5. Seeding pre-cached study roadmap for 7480201 (Information Technology)...")
        roadmap_res = await session.execute(select(MajorRoadmap).where(MajorRoadmap.major_code == "7480201"))
        if not roadmap_res.scalar_one_or_none():
            it_roadmap = MajorRoadmap(
                major_code="7480201",
                title="Lộ trình tự học chuẩn bị nhập môn ngành Công nghệ thông tin (7480201)",
                version="1.0-verified",
                roadmap_data={
                    "milestones": [
                        {
                            "step": 1,
                            "title": "Tư duy máy tính và Lập trình cơ bản với Python",
                            "description": "Nắm vững cú pháp Python, các cấu trúc điều khiển rẽ nhánh, vòng lặp và xử lý cấu trúc dữ liệu cơ bản.",
                            "duration_weeks": 4,
                            "learning_objectives": [
                                "Hiểu mô hình thực thi mã nguồn",
                                "Viết thuật toán xử lý chuỗi và danh sách",
                                "Xây dựng chương trình quản lý thông tin dòng lệnh"
                            ],
                            "actions": [
                                "Hoàn thành khóa học CS50P - CS50 Introduction to Programming with Python",
                                "Luyện tập 30 bài tập thuật toán căn bản trên LeetCode / HackerRank",
                                "Đóng gói mã nguồn lên kho lưu trữ GitHub cá nhân"
                            ]
                        },
                        {
                            "step": 2,
                            "title": "Toán rời rạc và Cấu trúc dữ liệu & Giải thuật",
                            "description": "Phát triển tư duy phân tích độ phức tạp thời gian O(n), cấu trúc dữ liệu ngăn xếp, hàng đợi, cây nhị phân.",
                            "duration_weeks": 6,
                            "learning_objectives": [
                                "Phân tích Big-O notation",
                                "Thực thi danh sách liên kết, cây tìm kiếm nhị phân",
                                "Áp dụng thuật toán tìm kiếm nhị phân và quy hoạch động"
                            ],
                            "actions": [
                                "Đọc sách giáo trình Cấu trúc dữ liệu và Giải thuật",
                                "Cài đặt thuật toán bằng Python/C++",
                                "Thực hiện đồ án tìm đường đi ngắn nhất đồ thị"
                            ]
                        },
                        {
                            "step": 3,
                            "title": "Cơ sở dữ liệu quan hệ và Xây dựng Backend REST API",
                            "description": "Làm quen với hệ quản trị cơ sở dữ liệu quan hệ PostgreSQL và thiết kế kiến trúc API theo chuẩn RESTful.",
                            "duration_weeks": 4,
                            "learning_objectives": [
                                "Thiết kế chuẩn hóa cơ sở dữ liệu 3NF",
                                "Viết truy vấn SQL phức tạp (JOIN, GROUP BY, Indexing)",
                                "Xây dựng dịch vụ API với FastAPI / Flask"
                            ],
                            "actions": [
                                "Cài đặt và thiết kế cơ sở dữ liệu PostgreSQL",
                                "Xây dựng ứng dụng quản lý học tập kết nối database",
                                "Viết tài liệu Swagger / OpenAPI"
                            ]
                        }
                    ],
                    "prerequisite_knowledge": [
                        "Toán THPT: Hàm số, phương trình và tư duy hình học không gian",
                        "Kỹ năng sử dụng máy tính cá nhân và hệ điều hành (Windows/Linux)",
                        "Tiếng Anh cơ bản để đọc thông báo lỗi và tài liệu kỹ thuật"
                    ],
                    "target_skills": [
                        "Kỹ năng lập trình phần mềm với Python/C++",
                        "Tư duy tối ưu hóa giải thuật và xử lý dữ liệu lớn",
                        "Kỹ năng thiết kế hệ thống phần mềm và làm việc với Git"
                    ],
                    "reference_materials": [
                        {
                            "title": "CS50's Introduction to Computer Science",
                            "author_or_institution": "Harvard University / edX",
                            "url": "https://cs50.harvard.edu/x",
                            "material_type": "online_course"
                        },
                        {
                            "title": "Chương trình khung đào tạo ngành Công nghệ thông tin",
                            "author_or_institution": "Đại học Bách Khoa Hà Nội & ĐHQG",
                            "url": "https://hust.edu.vn",
                            "material_type": "curriculum"
                        }
                    ],
                    "source_title": "Chương trình chuẩn đào tạo kỹ sư CNTT - Đại học Quốc gia & Bách Khoa",
                    "source_url": "https://hust.edu.vn",
                    "source_page": "Khung 2024"
                },
                is_fallback=False,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            session.add(it_roadmap)
            await session.commit()
            print("   Created verified cached roadmap for major 7480201.")

        # 6. Seed Sample Staging Record (STREAM_A_MOET & STREAM_B_ROADMAP)
        print("6. Seeding sample Human-in-the-Loop staging records...")
        stage_hash_a = "a" * 64
        stage_res_a = await session.execute(select(StagingRecord).where(StagingRecord.content_hash == stage_hash_a))
        if not stage_res_a.scalar_one_or_none():
            staged_a = StagingRecord(
                stream_type=StagingStreamType.STREAM_A_MOET,
                status=StagingStatus.APPROVED,
                major_code="7480201",
                content_hash=stage_hash_a,
                raw_content="Trích lục Thông tư 09/2022/TT-BGDĐT: Mã ngành 7480201 - Công nghệ thông tin",
                extracted_payload={"major_code": "7480201", "name": "Công nghệ thông tin", "degree_level": "Đại học"},
                source_title="Thông tư 09/2022/TT-BGDĐT",
                source_url="https://moet.gov.vn/van-ban/van-ban-chi-dao-dieu-hanh/Pages/chi-tiet-van-ban.aspx?ItemID=8233",
                source_page="Trang 18",
                retrieved_at=datetime.now(timezone.utc),
                reviewed_by=admin_user.id,
                reviewed_at=datetime.now(timezone.utc),
                review_notes="Đã đối chiếu chính xác mã ngành cấp IV theo Thông tư gốc."
            )
            session.add(staged_a)

        stage_hash_b = "b" * 64
        stage_res_b = await session.execute(select(StagingRecord).where(StagingRecord.content_hash == stage_hash_b))
        if not stage_res_b.scalar_one_or_none():
            staged_b = StagingRecord(
                stream_type=StagingStreamType.STREAM_B_ROADMAP,
                status=StagingStatus.PENDING,
                major_code="7480108",
                content_hash=stage_hash_b,
                raw_content="Đề cương học tập Trí tuệ nhân tạo thu thập từ MIT OpenCourseWare",
                extracted_payload={
                    "major_code": "7480108",
                    "major_title": "Trí tuệ nhân tạo",
                    "prerequisite_knowledge": ["Đại số tuyến tính", "Xác suất thống kê", "Python cơ bản"],
                    "target_skills": ["Machine Learning", "Deep Learning", "Computer Vision"],
                    "milestones": [
                        {"step": 1, "title": "Cơ sở toán học cho AI", "description": "Giải tích ma trận và tối ưu hóa hàm mất mát", "duration_weeks": 4, "learning_objectives": ["Gradient Descent"], "actions": ["Làm bài tập"]}
                    ],
                    "reference_materials": [
                        {"title": "MIT 6.036 Introduction to Machine Learning", "author_or_institution": "MIT", "url": "https://ocw.mit.edu", "material_type": "online_course"}
                    ],
                    "source_title": "MIT OCW Artificial Intelligence Course",
                    "source_url": "https://ocw.mit.edu/courses/6-036-introduction-to-machine-learning-spring-2020/",
                    "source_page": "Syllabus"
                },
                source_title="MIT OCW Machine Learning Curriculum",
                source_url="https://ocw.mit.edu/courses/6-036-introduction-to-machine-learning-spring-2020/",
                source_page="Syllabus Page",
                retrieved_at=datetime.now(timezone.utc)
            )
            session.add(staged_b)

        await session.commit()
        print("   Staging records verified.")

    print("=" * 70)
    print("SEEDING COMPLETED SUCCESSFULLY!")
    print(f"Total Level-IV Majors: {len(MAJORS_DATA)}")
    print(f"Total Subject Blocks: {len(SUBJECT_BLOCKS_DATA)}")
    print(f"Total Skills Seeded: {len(SKILLS_DATA)}")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(seed_data())
