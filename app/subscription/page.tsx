import { HeroModel } from "@/components/hero-model";
import { PageIntro } from "@/components/page-intro";
import { SubscriptionDeck } from "@/components/subscription-deck";
import { formatNumber, platformSnapshot, subscriptionPlans } from "@/lib/catalog";

const subscriptionDrivers = [
  "Free cocok untuk mulai belajar tanpa hambatan awal.",
  "Pro cocok untuk latihan yang lebih rutin dan stabil.",
  "Elite cocok untuk akses paling lengkap dan latihan intensif.",
];

export default function SubscriptionPage() {
  return (
    <div className="stack-xl">
      <PageIntro
        eyebrow="Subscription"
        title="Pilih paket belajar yang sesuai dengan kebutuhan"
        description="Tersedia tiga paket untuk membantu Anda memilih akses belajar yang paling cocok, dari penggunaan ringan sampai latihan yang lebih intensif."
        badges={["Free", "Pro", "Elite"]}
        note="Bandingkan fitur tiap paket lalu pilih yang paling sesuai dengan target belajar Anda."
        stats={[
          { label: "Tier", value: subscriptionPlans.length.toString() },
          { label: "Set aktif", value: formatNumber(platformSnapshot.totalTryouts) },
          { label: "Kategori", value: formatNumber(platformSnapshot.totalCategories) },
        ]}
      >
        <HeroModel variant="premium" label="Pilihan paket" />
      </PageIntro>

      <section className="content-grid content-grid--three">
        {subscriptionDrivers.map((copy) => (
              <article key={copy} className="glass-panel stat-surface">
             <span>Paket</span>
             <strong>Pilihan akses</strong>
             <p>{copy}</p>
           </article>
        ))}
      </section>

      <SubscriptionDeck plans={subscriptionPlans} />
    </div>
  );
}
