import { newsList } from "@/lib/mockNews";
import { NewsCard } from "./NewsCard";
import { AdZone } from "./AdZone";

export function NewsGrid() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Последние новости</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsList.slice(0, 3).map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}

          {/* Ad Zone after 3rd card */}
          <div className="flex items-center justify-center">
            <AdZone width={300} height={250} zoneClass="next-ads-zone-3" id="ad-zone-grid-1" />
          </div>

          {newsList.slice(3, 6).map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}

          {/* Leaderboard Ad */}
          <div className="md:col-span-2 lg:col-span-3 flex justify-center my-4">
            <AdZone width={728} height={90} zoneClass="next-ads-zone-4" id="ad-zone-leaderboard" />
          </div>

          {newsList.slice(6).map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      </div>
    </section>
  );
}
