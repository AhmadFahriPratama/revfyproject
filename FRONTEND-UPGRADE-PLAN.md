# Frontend Upgrade Master Plan

Dokumen ini berisi plan besar upgrade frontend Revfy agar lebih hidup, lebih ringan, lebih kuat secara brand, dan siap berkembang dengan identitas visual baru menggunakan `logo.png` serta elemen 3D yang terkontrol.

## Tujuan Utama

- memperkuat identitas brand dengan `logo.png`
- membuat UI lebih hidup tanpa terasa berat
- memakai 3D secara strategis, bukan berlebihan
- menjaga performa desktop dan mobile
- menyiapkan fondasi untuk scale-up produk

## Prinsip Dasar

- 3D hanya dipakai di area penting
- halaman utilitas tetap fokus ke kecepatan dan keterbacaan
- mobile mendapatkan versi visual yang lebih ringan
- JSON tetap menjadi source utama konten untuk sekarang
- komponen visual harus reusable dan konsisten

## 200 Plan Upgrade

### A. Brand

1. Taruh `logo.png` di `public/brand/logo.png`.
2. Buat ukuran turunan logo untuk navbar, hero, login, dan footer.
3. Buat favicon dari `logo.png`.
4. Buat app icon untuk tab browser dan shortcut.
5. Jadikan logo sebagai elemen utama di navbar.
6. Jadikan logo sebagai emblem besar di halaman login.
7. Buat versi logo dengan glow halus untuk hero.
8. Buat watermark brand transparan untuk section besar.
9. Buat brand token agar ukuran dan spacing logo konsisten.
10. Gunakan logo sebagai texture ringan di satu model 3D utama.

### B. Layout

11. Refactor navbar agar lebih premium dan stabil saat scroll.
12. Buat header sticky yang tetap ringan di mobile.
13. Tambahkan quick access route ke `Materi`, `Tryout`, dan `Dashboard`.
14. Buat hero-to-content transition yang lebih halus.
15. Rapikan ritme section agar halaman tidak terasa datar.
16. Tambahkan section divider visual yang lebih khas.
17. Buat CTA hierarchy yang lebih jelas.
18. Buat footer yang terasa seperti bagian dari brand, bukan pelengkap.
19. Tambahkan command bar atau shortcut entry point untuk route penting.
20. Buat layout mobile yang tetap dramatis tetapi tidak penuh noise.

### C. Design System

21. Definisikan ulang typography scale untuk desktop dan mobile.
22. Buat token warna brand, premium, admin, dan learner.
23. Buat sistem button baru dengan kesan fisik 3D.
24. Buat card system baru dengan beberapa level elevasi.
25. Rapikan glass panel agar lebih bersih dan tidak terlalu kabur.
26. Buat badge, chip, dan pill yang lebih khas.
27. Buat sistem border dan glow agar tidak acak.
28. Standarkan radius, shadow, dan spacing global.
29. Buat input, select, dan form state yang lebih premium.
30. Buat loading, empty, dan error state yang seragam.

### D. Motion

31. Definisikan motion language global untuk hover, reveal, dan transition.
32. Buat hover state kartu yang terasa hidup tapi tidak berlebihan.
33. Buat press state tombol yang benar-benar terasa 3D.
34. Tambahkan microinteraction pada CTA utama.
35. Buat animasi masuk section saat scroll.
36. Tambahkan subtle parallax pada layer visual besar.
37. Tambahkan delayed reveal untuk statistik dan badge.
38. Buat transisi route terasa lebih halus.
39. Tambahkan motion guard untuk device lambat.
40. Tambahkan dukungan `prefers-reduced-motion`.

### E. Fondasi 3D

41. Buat 3D performance budget per halaman.
42. Jadikan komponen Three.js di-load secara lazy.
43. Buat quality mode `high`, `medium`, dan `lite`.
44. Gunakan satu scene utama per halaman penting.
45. Hindari render canvas di halaman yang tidak membutuhkannya.
46. Buat library material 3D yang bisa dipakai ulang.
47. Buat library cahaya dasar yang hemat.
48. Buat sistem fallback ke visual statis jika device lemah.
49. Gunakan texture kecil dan asset terkompresi.
50. Batasi shadow berat hanya di scene utama.

### F. Library Model 3D

51. Buat model `brand monolith` berbasis logo.
52. Buat model `knowledge crystal` untuk halaman materi.
53. Buat model `orbit ring` untuk navigasi kategori.
54. Buat model `exam core` untuk halaman tryout.
55. Buat model `premium capsule` untuk subscription.
56. Buat model `admin radar` untuk dashboard admin.
57. Buat model `signal shard` untuk aksen data.
58. Buat model `result prism` untuk halaman hasil simulasi.
59. Buat model `topic node` untuk relasi materi dan soal.
60. Buat particle system ringan untuk ambient scene.

### G. Home

61. Rebuild hero Home agar jadi pusat identitas visual produk.
62. Tempatkan logo sebagai bagian dari reveal utama Home.
63. Tambahkan 3D hero besar yang interaktif terhadap pointer.
64. Tambahkan section pengantar jalur belajar yang lebih sinematik.
65. Tambahkan section perbandingan free vs premium.
66. Tambahkan route showcase yang lebih visual.
67. Tambahkan statistik platform dengan animasi yang terukur.
68. Tambahkan subject cloud atau orbit kategori.
69. Buat CTA ganda yang lebih tegas untuk learner dan admin.
70. Tambahkan ending section yang mendorong login atau mulai tryout.

### H. Materi

71. Buat halaman materi seperti peta pengetahuan, bukan grid biasa.
72. Tambahkan filter kategori, level, dan subject.
73. Buat detail materi dengan struktur section yang lebih elegan.
74. Tambahkan sticky outline untuk section materi.
75. Tambahkan mini 3D node di hero materi.
76. Tambahkan related materials di bagian bawah.
77. Tambahkan chip tag yang lebih informatif.
78. Tambahkan reading mode yang lebih fokus.
79. Tambahkan bookmark state lokal untuk materi.
80. Tambahkan progress indicator membaca materi.

### I. Soal Dan Tryout

81. Samakan visual language `Latihan Soal`, `Soal Asli`, dan `Tryout`.
82. Buat cover style untuk setiap set soal.
83. Tambahkan filter topik, kesulitan, dan jenis set.
84. Tambahkan preview soal yang lebih rapi sebelum mulai.
85. Buat halaman detail set lebih taktis dan lebih bersih.
86. Tambahkan indikator jumlah soal, durasi, dan fokus secara visual.
87. Upgrade tampilan simulasi agar lebih fokus dan tidak padat.
88. Tambahkan result report page yang lebih premium.
89. Tambahkan visual progress save/resume yang lebih jelas.
90. Tambahkan 3D accent kecil di detail tryout, bukan scene berat penuh.

### J. Dashboard

91. Upgrade dashboard user menjadi lebih personal dan lebih hidup.
92. Tambahkan 3D identity object yang berubah mengikuti plan user.
93. Rapikan analytics cards agar lebih mudah dibaca.
94. Tambahkan timeline attempt yang lebih jelas.
95. Tambahkan widget progress aktif dari simulasi terakhir.
96. Tambahkan ringkasan kategori yang sering dikerjakan.
97. Tambahkan recommendation strip yang lebih visual.
98. Tambahkan subscription status widget yang lebih premium.
99. Tambahkan state khusus untuk user baru yang belum punya history.
100. Tambahkan mode dashboard ringan khusus mobile.

### K. Admin

101. Rapikan admin dashboard agar lebih data-first.
102. Tambahkan database overview yang lebih visual.
103. Buat data table admin lebih rapi dan cepat dipindai.
104. Tambahkan filter user, progress, dan attempts.
105. Tambahkan admin insight panel untuk health konten.
106. Tambahkan visual ringkas untuk jumlah user, attempts, dan sessions.
107. Gunakan 3D hanya sebagai aksen kecil di admin.
108. Tambahkan empty state admin yang lebih jelas.
109. Tambahkan status koneksi backend/database yang mudah dibaca.
110. Tambahkan panel quick actions admin.

### L. Login Dan Subscription

111. Jadikan login sebagai portal brand, bukan form polos.
112. Tambahkan logo besar dan visual portal 3D di login.
113. Perjelas perbedaan backend auth dan local fallback.
114. Buat form lebih meyakinkan dengan state validasi yang baik.
115. Upgrade subscription page jadi lebih teatrikal tapi tetap ringan.
116. Tambahkan visual pembeda plan Free, Pro, dan Elite.
117. Tambahkan state plan aktif yang lebih tegas.
118. Tambahkan CTA upgrade yang lebih kuat.
119. Tambahkan benefit comparison yang lebih mudah dipindai.
120. Tambahkan visual premium capsule untuk plan berbayar.

### M. Performa

121. Audit semua canvas dan kurangi yang tidak perlu.
122. Pastikan semua komponen 3D dipisah dengan dynamic import.
123. Gunakan `next/image` untuk `logo.png` dan asset visual.
124. Kompres semua texture dan model 3D.
125. Gunakan GLB terkompresi bila nanti pakai model file nyata.
126. Turunkan jumlah particle di mobile.
127. Pause animasi saat tab tidak aktif.
128. Hindari kalkulasi berat setiap frame bila bisa di-cache.
129. Buat poster fallback untuk scene besar.
130. Tetapkan target Lighthouse khusus homepage.

### N. Aksesibilitas

131. Pastikan kontras warna tetap tinggi meski banyak glow.
132. Pastikan semua tombol 3D tetap mudah dibaca.
133. Pastikan keyboard navigation tetap baik.
134. Pastikan focus state jelas.
135. Pastikan scene 3D tidak mengganggu pembaca layar.
136. Tambahkan label dan alt untuk identitas brand.
137. Pastikan motion berat bisa dimatikan.
138. Pastikan ukuran tap target aman di mobile.
139. Pastikan font dan layout tetap jelas di layar kecil.
140. Audit seluruh form dan dashboard untuk aksesibilitas dasar.

### O. Konten Dan Data

141. Pertahankan JSON sebagai source utama untuk sekarang.
142. Rapikan adapter data agar semua halaman baca format yang seragam.
143. Buat metadata layer untuk materi dan soal agar lebih mudah dipresentasikan.
144. Tambahkan mapping thumbnail atau visual per kategori.
145. Tambahkan subject-level icon system.
146. Tambahkan label premium atau free langsung dari data layer.
147. Tambahkan summary otomatis untuk set besar.
148. Tambahkan related content suggestion berbasis kategori.
149. Tambahkan struktur data untuk featured content.
150. Siapkan data flag untuk publish highlight tertentu di Home.

### P. Kualitas

151. Audit setiap halaman untuk konsistensi visual.
152. Audit semua state kosong dan error.
153. Audit mobile layout per halaman.
154. Audit dark theme consistency.
155. Audit kecepatan render scene 3D.
156. Audit ukuran bundle halaman penting.
157. Audit hierarki tipografi.
158. Audit keseragaman spacing.
159. Audit kenyamanan scroll panjang.
160. Audit transisi antar halaman.

### Q. Roadmap Eksekusi

161. Fase 1: integrasi `logo.png` dan refresh brand.
162. Fase 2: refactor design system dan button 3D.
163. Fase 3: rebuild Home sebagai showcase utama.
164. Fase 4: upgrade Materi dan Tryout.
165. Fase 5: upgrade Dashboard dan Admin.
166. Fase 6: optimasi performa besar-besaran.
167. Fase 7: polish motion, loading, dan fallback.
168. Fase 8: QA desktop dan mobile.
169. Fase 9: final asset compression dan bundle cleanup.
170. Fase 10: siap deploy final ke VPS.

### R. Prioritas Paling Masuk Akal

171. Mulai dari `logo.png`.
172. Lanjut design system.
173. Lalu Home.
174. Setelah itu Tryout.
175. Baru Dashboard.
176. Admin sesudah data visual utama stabil.
177. Scene 3D besar cukup di beberapa halaman utama.
178. Halaman utilitas tetap fokus ke kecepatan.
179. Mobile harus selalu punya mode lebih ringan.
180. Jangan tambah 3D baru sebelum quality gate performa lolos.

### S. 3D Khusus Yang Disarankan

181. Home: `brand monolith` + orbit ring.
182. Materi: `knowledge crystal`.
183. Tryout: `exam core`.
184. Dashboard: `result prism`.
185. Subscription: `premium capsule`.
186. Admin: `admin radar`.
187. Login: `portal shard`.
188. Footer: ambient particles kecil saja.
189. Background global: stars + sparkles ringan.
190. Card hover: pakai CSS depth, bukan Three.js.

### T. Penyederhanaan Agar Tetap Ringan

191. Gunakan Three.js hanya untuk scene penting.
192. Gunakan CSS 3D untuk tombol dan card.
193. Gunakan background motion sederhana di halaman sekunder.
194. Gunakan komponen visual reuse sebanyak mungkin.
195. Jangan pakai banyak model file berbeda tanpa alasan.
196. Satu tema visual utama lebih efisien daripada banyak tema acak.
197. Render logic harus dibatasi per halaman.
198. Prioritaskan perceived performance, bukan efek paling ramai.
199. Biarkan konten tetap mudah dibaca meski visual kaya.
200. Jadikan “hidup dan ringan” sebagai aturan utama setiap keputusan desain.

## Prioritas Eksekusi Yang Disarankan

### Priority 1

- integrasi `logo.png`
- refresh navbar dan footer
- update hero Home
- buat visual brand utama

### Priority 2

- refactor design system
- tombol 3D baru
- kartu, chip, panel, form states

### Priority 3

- bangun scene 3D utama Home
- upgrade halaman Tryout dan Dashboard
- tambah mode performance-aware

### Priority 4

- polish admin
- upgrade subscription
- audit mobile, performance, accessibility

## Hasil Akhir Yang Dituju

- brand terasa lebih kuat
- tampilan lebih hidup dan premium
- 3D terasa strategis, bukan berat
- mobile tetap nyaman
- siap dipakai sebagai fondasi deploy VPS dan pengembangan lebih lanjut
