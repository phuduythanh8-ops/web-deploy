import websitePolicy from '@/content/website-policy.txt?raw';
import eventPolicy from '@/content/event-policy.txt?raw';

export const websitePrices = [
  { name: 'Web đơn giản', price: '49.000đ – 99.000đ', description: 'Phù hợp với các website chủ yếu để hiển thị nội dung, hình ảnh hoặc một chức năng nhỏ.', examples: 'Thiệp mời, trang văn bản, trang trình bày nội dung, portfolio đơn giản, landing page, vòng quay, phả hệ và các công cụ đơn giản.' },
  { name: 'Web cơ bản', price: '99.000đ – 199.000đ', description: 'Phù hợp với website có nhiều nội dung và nhiều khu vực hiển thị hơn.', examples: 'Website cá nhân, giới thiệu cửa hàng, thương hiệu, doanh nghiệp, group, clan, guild, team, cộng đồng hoặc sự kiện.' },
  { name: 'Web có chức năng', price: '199.000đ – 299.000đ', description: 'Phù hợp với website có thêm biểu mẫu, thu thập thông tin, đăng ký hoặc quản lý nội dung.', examples: 'Website sự kiện có đăng ký, website dịch vụ, blog, tin tức, website có hệ thống quản trị nội dung hoặc các chức năng tương tác.' },
  { name: 'Web nâng cao', price: '299.000đ – 399.000đ', description: 'Phù hợp với website có hệ thống dữ liệu và chức năng quản lý phức tạp hơn.', examples: 'Website đặt lịch, bán hàng, quản lý đơn hàng, cộng đồng/diễn đàn hoặc website có hệ thống quản trị riêng.' },
  { name: 'Web theo yêu cầu', price: '199.000đ – 399.000đ', description: 'Dành cho các website có chức năng riêng hoặc kết hợp nhiều loại website. Giá được xác định dựa trên số lượng trang và mức độ phức tạp của chức năng.' },
];

// Only replace the exact original provisional copy. Saved owner edits always win.
const provisionalPolicies: Record<string, string> = {
  web: 'Khách vui lòng cung cấp mục tiêu website, nội dung và những chức năng cần phát triển từ demo. Mức giá đề xuất là cơ sở để hai bên trao đổi, chưa phải xác nhận mua hoặc chuyển giao quyền sở hữu. Chí Quy phản hồi trong vòng 7 ngày và thống nhất phạm vi, tiến độ cùng quyền sử dụng trước khi thực hiện. Thanh toán bằng chuyển khoản theo thỏa thuận đã được xác nhận.',
  event: 'Khách vui lòng cung cấp loại sự kiện, địa điểm dự kiến và các yêu cầu triển khai từ mẫu đã chọn. Mức giá đề xuất chưa bao gồm cam kết về phạm vi thực hiện hay quyền sở hữu demo. Phong Hưởng phản hồi trong vòng 7 ngày và thống nhất kế hoạch, chi phí cùng trách nhiệm của các bên trước khi triển khai. Thanh toán bằng chuyển khoản theo thỏa thuận được xác nhận.',
};
export function servicePolicy(slug: string, policy: string) {
  if (policy !== provisionalPolicies[slug]) return policy;
  return slug === 'web' ? websitePolicy : eventPolicy;
}