# MageBooster Moka United ödeme modülü: kullanım kılavuzu

**Paket:** `magebooster/module-moka`
**Lisans:** ücretli, seri numarası gerekir
**Ödeme yöntemi kodu:** `magebooster_moka`
**Destek:** info@magebooster.com

## Ne işe yarar

Bu modül Moka United'ı 3D Secure destekli bir kartla ödeme yöntemi olarak Magento'ya ekler.

### Ödeme akışı

1. **Sipariş verilir.** Müşteri siparişi verir. Sipariş **Pending Payment** (ödeme bekleniyor) durumunda kaydedilir.
2. **Kart sayfası açılır.** Müşteri önce `/mbmoka/redirect/start` adresine, oradan kart sayfası `/mbmoka/redirect/pay` adresine yönlendirilir. Kart sayfası sizin mağaza alan adınızdadır.
3. **Kart Moka'ya iletilir.** Kart bilgisi sunucudan sunucuya Moka'ya gönderilir (`DoDirectPaymentThreeD`). Müşteri ardından bankasının 3D Secure ekranını tamamlar.
4. **Sonuç kontrol edilir.** Moka müşteriyi `/mbmoka/payment/callback` adresine geri gönderir. Modül gelen yanıtı `hashValue` ve `CodeForHash` ile doğrular.
5. **Sipariş güncellenir.**
   - **Başarılı ödeme:** fatura kesilir, sipariş **Processing** durumuna geçer.
   - **Kart reddedilirse:** müşteri yeniden denemek için kart sayfasına döner.
   - **Hata ya da vazgeçme:** sipariş iptal edilir, sepet geri yüklenir.

### İade

Online iade faturası (credit memo) oluşturduğunuzda iade isteği Moka'ya `DoCreateRefundRequest` ile gider. Aynı gün alınan ödemelerde iade yerine Moka panelinden iptal (void) gerekebilir.

### Güvenlik ve para birimi

- **İmzalı dönüş adresleri:** Dönüş adreslerindeki sipariş numarası imzalıdır. Elle değiştirilemez.
- **Kart bilgisi saklanmaz:** Modül kart bilgisini hiçbir yerde saklamaz. Hata kaydında kart numarası ve gizli bilgiler maskelenir.
- **Para birimi çevrimi:** "Currencies charged directly" listesinde olmayan para birimindeki siparişler, mağazada kayıtlı kurla TRY'ye çevrilir. TRY tutarı ödeme adımında ve siparişte gösterilir.

### PCI notu

Kart formu sizin alan adınızdan sunulduğu için mağaza PCI DSS kapsamında SAQ A değil, SAQ A-EP veya SAQ D'ye girer. Bunu bankanızla ya da ödeme kuruluşunuzla teyit edin.

## Gereksinimler

- PHP 8.0 veya üzeri
- Magento 2.4.4 – 2.4.9
- Moka United üye işyeri hesabı: bayi kodu, API kullanıcı adı ve API şifresi
- **Luma sürümü:** `magebooster/module-moka`
- **Hyvä sürümü:** `magebooster/module-moka-hyva`. Ayrı indirilir.

### Hyvä durumu

Bu paket, Luma tabanlı ödeme sayfaları için bir Knockout ödeme bileşeni içerir. Sunucu tarafı (yönlendirme, dönüş, iade) her temada aynıdır. Modülün README dosyasında Hyvä Checkout bileşeni "planlanan" olarak geçiyor. Hyvä mağazada kullanmadan önce Hyvä sürümünün hazır olduğunu teyit edin.

## Composer ile kurulum

```bash
composer require magebooster/module-moka
```

## Zip dosyasıyla kurulum

1. Arşivi `app/code/MageBooster/Moka` klasörüne açın.
2. Aşağıdaki komutları çalıştırın.

## Modülü etkinleştirme

```bash
bin/magento module:enable MageBooster_Moka
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento setup:static-content:deploy -f
bin/magento cache:flush
```

## Yönetim paneli ayarları

Ayarlar **Stores > Configuration > Sales > Payment Methods > Moka United · MageBooster** altındadır.

| Alan | Varsayılan | Açıklama |
|---|---|---|
| Enabled | Hayır | Yöntemi ödeme adımında gösterir. |
| Title | Credit / debit card (Moka) | Ödeme adımında ve siparişte görünen ad. |
| Text shown at checkout | (boş) | Yöntem adının altında görünen kısa açıklama. |
| Test mode | Evet | Test API adresini ve test bilgilerini kullanır. Gerçek para çekilmez. |
| Dealer code | (boş) | Moka bayi kodunuz. |
| API username | (boş) | Moka API kullanıcı adınız. |
| API password | (boş) | Moka API şifreniz. Şifreli saklanır. |
| Test API address | `https://service.refmokaunited.com` | Moka test servisi. |
| Live API address | `https://service.mokaunited.com` | Moka canlı servisi. |
| Currencies charged directly | TRY,USD,EUR,GBP | Doğrudan çekilecek para birimleri, virgülle ayrılır. Diğerleri kayıtlı kurla TRY'ye çevrilir. |
| Payment from applicable countries | Tüm izinli ülkeler | Yöntemi belirli ülkelerle sınırlar. |
| Payment from specific countries | (boş) | Bir önceki alanda "belirli ülkeler" seçildiyse kullanılır. |
| Sort order | 60 | Ödeme yöntemleri arasındaki sırası. |
| Debug log | Hayır | İstekleri ve yanıtları `var/log/magebooster_mbmoka.log` dosyasına yazar. Kart bilgisi ve gizli bilgiler yazılmaz. |

## Test

1. **Hazırlık:** **Test mode** ve **Debug log** ayarlarını açın. Moka test bilgilerinizi girin.
2. **Başarılı ödeme:** Moka test kartıyla sipariş verin ve 3D Secure adımını tamamlayın.
   - Siparişin **Processing** durumunda ve faturalı olduğunu kontrol edin.
   - `magebooster_mbmoka.log` dosyasında isteğin ve dönüşün yazıldığını kontrol edin.
3. **Reddedilen kart:** Reddedilecek bir kartla deneyin. Kart sayfasına geri dönmelisiniz.
4. **Vazgeçme:** 3D Secure ekranından vazgeçin. Sipariş iptal edilmeli, sepet geri gelmeli.
5. **İade:** Ödenmiş bir sipariş için online credit memo oluşturun. İade isteği hem kayıtta hem Moka panelinde görünmeli.
6. **Canlıya geçiş:** Bu adımların hepsi sorunsuz geçtikten sonra Test mode'u kapatın.

## Bilinen sınırlar

- **Canlıda test edilmedi:** Bu sürüm henüz canlı Moka servisinde denenmedi. Önce küçük bir gerçek ödemeyle deneyin.
- **Hash formülü:** Dönüş kontrolü Moka'nın `hashValue` formülüne dayanır. Kayıtta "hashValue did not match" görürseniz önce hesabınız için geçerli formülü Moka'ya sorun, sonra bize yazın.
- **SameSite çerezleri:** Moka sonucu siteler arası bir POST ile gönderir. `SameSite=Lax` oturum çerezinde bazı tarayıcılar bu istekte yeni bir oturum açabilir. Ödeme yine doğru işlenir, çünkü modül oturumu değil imzalı sipariş numarasını kullanır. Yine de başarı sayfasının açıldığını test edin.

## Sorun giderme

- **Yöntem ödeme adımında görünmüyor:**
  - **Enabled** ayarının açık olduğunu kontrol edin.
  - Ülke ayarlarını kontrol edin.
  - Siparişin para birimi "Currencies charged directly" listesinde değilse TRY kurunun kayıtlı olduğundan emin olun.
- **Sipariş Pending Payment durumunda kalıyor:** Müşteri 3D Secure adımını bitirmemiş ya da dönüş isteği mağazaya ulaşamamış olabilir.
  - Kaydı kontrol edin.
  - `/mbmoka/payment/callback` adresinin güvenlik duvarına ya da bakım sayfasına takılmadığından emin olun.
- **"hashValue did not match":** Bilinen sınırlar bölümüne bakın.

## Kaldırma

1. **Enabled** ayarını kapatın.
2. Pending Payment durumunda bekleyen sipariş kalmadığından emin olun.
3. Aşağıdaki komutları çalıştırın:

```bash
bin/magento module:disable MageBooster_Moka
composer remove magebooster/module-moka
bin/magento setup:upgrade
bin/magento cache:flush
```

Geçmiş siparişlerdeki ödeme bilgileri yerinde kalır.

## Lisans ve kopyalama

Ticari lisans, bkz. `LICENSE.txt`. Telif hakkı (c) 2026 WebWorks 101 OÜ (MageBooster). Tüm hakları saklıdır.

- Bir seri numarası = bir canlı kurulum (bir mağaza alan adı). Aynı mağazanın test (staging) ve geliştirme kopyaları serbesttir.
- Her seri numarası ve her indirme, satın alan müşteriye bağlıdır. Luma ve Hyvä sürümleri ayrı ürünlerdir, seri numaraları da ayrıdır.
- Kodu kendi lisanslı mağazanız için değiştirebilirsiniz. Telif ve lisans notlarını silmeyin.
- Yasak olanlar: başka mağazalara kopyalamak, dağıtmak, yeniden satmak, alt lisans vermek, herkese açık depolarda, pazar yerlerinde veya forumlarda yayınlamak, lisans kontrolünü ya da bu notları kaldırmak, seri numarasını paylaşmak.
- İzinsiz kopyalama veya kullanımda seri numarası iade yapılmadan iptal edilir, güncelleme ve destek durur; WebWorks 101 OÜ tazminat isteyebilir ve yasal yola gidebilir. Estonya hukuku geçerlidir; yetkili mahkeme Harju İlçe Mahkemesi'dir (Harju Maakohus).

## Destek

info@magebooster.com
