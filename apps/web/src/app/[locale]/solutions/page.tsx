import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageHeader } from '@/components/layout/PageHeader';

export default async function SolutionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Solutions');

  const solutions = [
    {
      icon: '⚙️',
      vi: 'Tự động hoá dây chuyền',
      en: 'Line automation',
      dvi: 'Tối ưu năng suất và độ tin cậy trên toàn tuyến sản xuất.',
      den: 'Maximize throughput and reliability across the full production line.',
    },
    {
      icon: '🗄️',
      vi: 'Tủ điện điều khiển',
      en: 'Control cabinets',
      dvi: 'Thiết kế, chế tạo và thử nghiệm theo chuẩn IEC.',
      den: 'Designed, built, and tested to IEC standards.',
    },
    {
      icon: '🖥️',
      vi: 'PLC / SCADA',
      en: 'PLC / SCADA',
      dvi: 'Lập trình điều khiển và giám sát thời gian thực.',
      den: 'Real-time control programming and supervision.',
    },
    {
      icon: '🔗',
      vi: 'Tích hợp hệ thống',
      en: 'System integration',
      dvi: 'Kết nối các phân hệ và giao thức công nghiệp khác nhau.',
      den: 'Connect heterogeneous subsystems and industrial protocols.',
    },
    {
      icon: '🔧',
      vi: 'Bảo trì & hiệu chuẩn',
      en: 'Maintenance & calibration',
      dvi: 'Bảo trì phòng ngừa, hiệu chuẩn và hỗ trợ kỹ thuật 24/7.',
      den: 'Preventive maintenance, calibration, and 24/7 technical support.',
    },
  ];

  return (
    <div>
      <PageHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-5 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {solutions.map((s) => (
          <article
            key={s.en}
            className="group rounded-2xl border border-black/5 bg-white/50 p-6 backdrop-blur transition-all hover:-translate-y-1 hover:border-brand-blue/40 hover:shadow-lg hover:shadow-brand-blue/10 dark:border-white/10 dark:bg-white/5"
          >
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-blue/10 text-2xl">
              {s.icon}
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              {locale === 'vi' ? s.vi : s.en}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {locale === 'vi' ? s.dvi : s.den}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
