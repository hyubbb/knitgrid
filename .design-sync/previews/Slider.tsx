import { Slider } from 'knitgrid';
import { ZoomOut, ZoomIn } from 'lucide-react';

export const Zoom = () => (
  <Slider min={46} max={132} value={86} onChange={() => {}} leftIcon={ZoomOut} rightIcon={ZoomIn} valueLabel="86%" />
);
