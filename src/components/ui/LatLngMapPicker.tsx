import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type LatLngMapPickerProps = {
  latitude: number;
  longitude: number;
  heightClass?: string;
};

export default function LatLngMapPicker({
  latitude,
  longitude,
  heightClass = 'h-[320px]',
}: LatLngMapPickerProps) {
  const { t } = useTranslation();
  const [previewLat, setPreviewLat] = useState(latitude);
  const [previewLng, setPreviewLng] = useState(longitude);

  // Debounce iframe so typing lat/lng does not reload every keystroke
  useEffect(() => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    const timer = window.setTimeout(() => {
      setPreviewLat(latitude);
      setPreviewLng(longitude);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [latitude, longitude]);

  const mapSrc = useMemo(
    () => `https://www.google.com/maps?q=${previewLat},${previewLng}&z=15&output=embed`,
    [previewLat, previewLng],
  );

  return (
    <div>
      <p className="text-[11px] text-foreground-400 mb-2">{t('adminUi.businessConfig.mapPickerHint')}</p>
      <div className={`rounded-xl overflow-hidden border border-background-200/70 ${heightClass}`}>
        <iframe
          src={mapSrc}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={t('adminUi.businessConfig.mapPreviewTitle')}
        />
      </div>
    </div>
  );
}
