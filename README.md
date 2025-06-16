.EKLER dosyasının içerisinde uygulamanın APK dosyasını, tanıtım videosunu ve proje dokümanını (21290524.pdf) bulabilirsiniz.

Uygulama, veritabanı olarak Firebase altyapısını kullanmaktadır. 
Ayrıca "IOS-2-ProjeDokumani.pdf" dosyası, projenin planlama sürecine ait dokümantasyonu içermektedir.

Uygulamanın tüm sayfa ve yönlendirme yapıları "app" klasörü altında organize edilmiştir. 
Aşağıda "app/" klasörünün içeriği ve her dosyanın görevine ilişkin kısa açıklamalar verilmiştir:

app/

├── (app)/

│   ├── _layout.tsx         → Uygulama içi sayfa yönlendirmelerini yönetir.

│   ├── groups.tsx          → Grup listesi ve grup oluşturma burada yönetilir.

│   ├── home.tsx            → Kullanıcıların bireysel sohbet başlatabileceği ana sayfa.

│   ├── profile.tsx         → Profil düzenleme işlemleri burada yapılır.

│   └── settings.tsx        → Hesap silme ve engellenen kullanıcılar listesine erişim buradan sağlanır.

│

├── (auth)/

│   ├── _layout.tsx         → Giriş/kayıt sayfalarının yönlendirmeleri burada yönetilir.

│   ├── index.tsx           → Giriş ekranı.

│   └── signup.tsx          → Kayıt ekranı.

│

├── _layout.tsx             → Uygulamanın genel layout ve yönlendirme yapısı.

├── blockedUsers.tsx        → Engellenmiş kullanıcıların listelendiği ve engelin kaldırılabildiği ekran.

├── chat.tsx                → Birebir mesajlaşma ekranı.

├── groupChat.tsx           → Grup mesajlaşma ekranı.

└── groupDetails.tsx        → Grup üyelerini yönetme, adminlik ve gruptan çıkma gibi işlemlerin yapıldığı grup hakkında ekranı.
