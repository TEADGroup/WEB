/**
 * Static data cho Home page — tách riêng khỏi component để dễ maintain,
 * test, và tái sử dụng. Đây là hardcoded content cho tới khi có CMS.
 */
import {
  Target, BarChart3, Users, Cpu,
  Radio, Monitor, Cloud, Wifi, Eye, Shield,
} from 'lucide-react';
import type { ComponentType } from 'react';

/* ─── Stats ─── */

export interface Stat {
  value: string;
  labelVi: string;
  labelEn: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
}

export const statsData: Stat[] = [
  { value: '120+', labelVi: 'Dự án triển khai', labelEn: 'Projects delivered', Icon: BarChart3 },
  { value: '15+', labelVi: 'Năm kinh nghiệm', labelEn: 'Years of experience', Icon: Target },
  { value: '50+', labelVi: 'Khách hàng / nhà máy', labelEn: 'Clients / plants', Icon: Users },
  { value: '24/7', labelVi: 'Hỗ trợ kỹ thuật', labelEn: 'Technical support', Icon: Cpu },
];

/* ─── Testimonials ─── */

export interface Testimonial {
  quoteVi: string;
  quoteEn: string;
  author: string;
  roleVi: string;
  roleEn: string;
  company: string;
  metricVi: string;
  metricEn: string;
  metricColor: string;
}

export const testimonialData: Testimonial[] = [
  {
    quoteVi: 'TEA Group đã giúp chúng tôi giảm 35% thời gian ngừng máy ngoài kế hoạch ngay trong 3 tháng đầu. Đội ngũ kỹ thuật rất chuyên nghiệp và trách nhiệm.',
    quoteEn: 'TEA Group helped us reduce unplanned downtime by 35% in the first 3 months. The engineering team is professional and dedicated.',
    author: 'Nguyễn Văn Anh',
    roleVi: 'Giám đốc Nhà máy',
    roleEn: 'Plant Director',
    company: 'Công ty TNHH Sản xuất XYZ',
    metricVi: '-35% downtime',
    metricEn: '-35% downtime',
    metricColor: '#00A651',
  },
  {
    quoteVi: 'Hệ thống SCADA mới giúp tôi giám sát toàn bộ dây chuyền từ điện thoại. Tiết kiệm ít nhất 10 giờ quản lý mỗi tuần.',
    quoteEn: 'The new SCADA system lets me monitor the entire production line from my phone. Saves at least 10 hours of management time per week.',
    author: 'Trần Thị Bích',
    roleVi: 'Trưởng phòng Kỹ thuật',
    roleEn: 'Head of Engineering',
    company: 'Nhà máy Chế biến ABC',
    metricVi: '-10h/tuần quản lý',
    metricEn: '-10h/week management',
    metricColor: '#0099FF',
  },
  {
    quoteVi: 'Chúng tôi đã hợp tác với TEA Group cho 3 dự án liên tiếp. Chất lượng tủ điện và tinh thần hỗ trợ luôn nhất quán.',
    quoteEn: 'We have partnered with TEA Group for 3 consecutive projects. Cabinet quality and support spirit are consistently excellent.',
    author: 'Lê Hoàng Minh',
    roleVi: 'Giám đốc Vận hành',
    roleEn: 'Operations Director',
    company: 'Tập đoàn Sản xuất DEF',
    metricVi: '3 dự án liên tiếp',
    metricEn: '3 consecutive projects',
    metricColor: '#FF3333',
  },
];

/* ─── Pain Points ─── */

export interface PainPoint {
  icon: string;
  titleKey: string;
  descKey: string;
  color: string;
}

export const painPointData: PainPoint[] = [
  { icon: 'clock', titleKey: 'pain1Title', descKey: 'pain1Desc', color: '#FF3333' },
  { icon: 'database', titleKey: 'pain2Title', descKey: 'pain2Desc', color: '#FF6600' },
  { icon: 'settings', titleKey: 'pain3Title', descKey: 'pain3Desc', color: '#0099FF' },
  { icon: 'search', titleKey: 'pain4Title', descKey: 'pain4Desc', color: '#00A651' },
];

/* ─── Google Maps embed ─── */
export const MAP_SRC =
  'https://www.google.com/maps?q=294%2F41%2F18+%C4%90%C6%B0%E1%BB%9Dng+s%E1%BB%91+8%2C+Th%C3%B4ng+T%C3%A2y+H%E1%BB%99i%2C+H%E1%BB%93+Ch%C3%AD+Minh&output=embed';

/* ─── Industry 4.0 ─── */

export interface Industry4Item {
  icon: ComponentType<{ size?: number }>;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  color: string;
  gradient: string;
}

export const industry4Data: Industry4Item[] = [
  {
    icon: Radio,
    titleVi: 'IIoT & Industrial IoT',
    titleEn: 'IIoT & Industrial IoT',
    descVi: 'Kết nối thiết bị, thu thập dữ liệu thời gian thực, giám sát từ xa qua nền tảng IoT công nghiệp.',
    descEn: 'Connect devices, collect real-time data, remote monitoring via industrial IoT platforms.',
    color: '#0099FF',
    gradient: 'from-[#0099FF] to-[#33B5FF]',
  },
  {
    icon: Monitor,
    titleVi: 'Digital Twin',
    titleEn: 'Digital Twin',
    descVi: 'Mô phỏng nhà máy số — phát hiện vấn đề trước khi xảy ra, tối ưu vận hành.',
    descEn: 'Digital plant simulation — detect issues before they happen, optimize operations.',
    color: '#00A651',
    gradient: 'from-[#00A651] to-[#33CC80]',
  },
  {
    icon: Cpu,
    titleVi: 'AI Predictive Maintenance',
    titleEn: 'AI Predictive Maintenance',
    descVi: 'AI dự đoán hỏng hóc trước 72h, lên lịch bảo trì thông minh, giảm downtime.',
    descEn: 'AI predicts failures 72h ahead, smart maintenance scheduling, reduce downtime.',
    color: '#FF3333',
    gradient: 'from-[#FF3333] to-[#FF6666]',
  },
  {
    icon: Cloud,
    titleVi: 'Cloud SCADA & Web HMI',
    titleEn: 'Cloud SCADA & Web HMI',
    descVi: 'Giám sát nhà máy từ bất kỳ đâu — web, mobile, tablet. Tích hợp AWS/Azure.',
    descEn: 'Monitor your plant from anywhere — web, mobile, tablet. AWS/Azure integrated.',
    color: '#FF6600',
    gradient: 'from-[#FF6600] to-[#FF9933]',
  },
  {
    icon: Wifi,
    titleVi: '5G & Private Network',
    titleEn: '5G & Private Network',
    descVi: 'Mạng 5G riêng cho nhà máy — độ trễ thấp, băng thông cao, kết nối hàng ngàn thiết bị.',
    descEn: 'Private 5G for factory — low latency, high bandwidth, connect thousands of devices.',
    color: '#9933FF',
    gradient: 'from-[#9933FF] to-[#CC66FF]',
  },
  {
    icon: Eye,
    titleVi: 'AR Maintenance & Vision AI',
    titleEn: 'AR Maintenance & Vision AI',
    descVi: 'Bảo trì với AR — kỹ thuật viên nhìn thấy chỉ dẫn ngay trên thiết bị. AI Vision cho QA.',
    descEn: 'AR-assisted maintenance — technicians see instructions on equipment. AI Vision for QA.',
    color: '#00CCBB',
    gradient: 'from-[#00CCBB] to-[#33EEDD]',
  },
  {
    icon: Radio,
    titleVi: 'OPC UA & MQTT',
    titleEn: 'OPC UA & MQTT',
    descVi: 'Kết nối chuẩn hóa — OPC UA cho nhà máy, MQTT cho IoT. Tích hợp dữ liệu end-to-end.',
    descEn: 'Standardized connectivity — OPC UA for factory, MQTT for IoT. End-to-end data integration.',
    color: '#0099FF',
    gradient: 'from-[#0099FF] to-[#33B5FF]',
  },
  {
    icon: Shield,
    titleVi: 'Cybersecurity & OT Security',
    titleEn: 'Cybersecurity & OT Security',
    descVi: 'Bảo vệ hệ thống điều khiển — ISA/IEC 62443, network segmentation, threat detection.',
    descEn: 'Protect control systems — ISA/IEC 62443, network segmentation, threat detection.',
    color: '#FF3333',
    gradient: 'from-[#FF3333] to-[#FF6666]',
  },
];
