# TaskFlow — Akıllı Proje Yönetimi

Yazılım staj projesi kapsamında geliştirilen, vanilla HTML/CSS/JS ile yazılmış Kanban tabanlı görev yönetim uygulaması.

## Özellikler

- **Kanban Panosu** — Yapılacak / Devam Ediyor / Tamamlandı sütunları, drag & drop ile taşıma
- **Görev Yönetimi** — Ekleme, düzenleme, silme (onay modalı); öncelik, proje, etiket, son tarih, açıklama, ilerleme (%) alanları
- **Filtreleme & Arama** — Önceliğe göre filtre, projeye göre filtre, başlık/açıklama/etiket üzerinden canlı arama
- **Son Tarih Takibi** — Gecikmiş / bu hafta / yakın badge'leri, sağ panelde yaklaşan tarihler listesi
- **İstatistik Kartları** — Toplam görev, tamamlanma yüzdesi, devam eden görev, gecikme sayısı
- **Aktivite Akışı** — Her işlem (ekleme, taşıma, silme, güncelleme) sağ panelde kaydedilir
- **localStorage Kalıcılığı** — Sayfa yenilense de veriler kaybolmaz
- **JSON Dışa Aktarma** — Görev listesini tek tıkla `.json` dosyası olarak indir
- **Klavye Kısayolları** — `Ctrl+N` yeni görev, `Ctrl+K` / `/` arama, `Esc` modal kapat

---

## Kullanılan Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Markup | HTML5 |
| Stil | CSS3 (CSS Variables, Grid, Flexbox, animasyonlar) |
| Mantık | Vanilla JavaScript (ES6+) |
| Yazı Tipleri | [Syne](https://fonts.google.com/specimen/Syne) + [DM Mono](https://fonts.google.com/specimen/DM+Mono) (Google Fonts) |
| Depolama | localStorage |

Harici framework, build aracı veya bağımlılık yoktur.

---

## Kurulum

```bash
git clone https://github.com/Beray104/taskflow.git
cd taskflow
```

`index.html` dosyasını herhangi bir tarayıcıda açın — sunucu gerekmez.

---

## Ekran Görüntüleri

> *(Buraya proje ekran görüntüsü eklenebilir)*

---

## Klavye Kısayolları

| Kısayol | İşlem |
|---------|-------|
| `Ctrl + N` | Yeni görev ekle |
| `Ctrl + K` veya `/` | Aramaya odaklan |
| `Esc` | Açık modalı kapat |
| `Enter` | Modal açıkken görevi kaydet |

---

## Proje Yapısı

```
taskflow/
├── index.html    # Sayfa yapısı (HTML)
├── styles.css    # Tüm stiller (tema, layout, animasyonlar)
└── app.js        # Uygulama mantığı (state, render, drag&drop, modal'lar)
```

---

## Geliştirme Notları

- Veriler `taskflow_tasks_v2` anahtarıyla `localStorage`'a kaydedilir.
- Görev verisi sıfırlamak için tarayıcı geliştirici araçlarından `localStorage.clear()` çalıştırın.
- Projeler şu an statik tanımlıdır; ilerleyen sürümde dinamik proje oluşturma eklenebilir.
