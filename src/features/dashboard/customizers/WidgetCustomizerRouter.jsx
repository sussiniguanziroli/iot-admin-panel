import React from 'react';
import MetricCustomizer from './MetricCustomizer';
import ChartCustomizer from './ChartCustomizer';
import GaugeCustomizer from './GaugeCustomizer';
import SwitchCustomizer from './SwitchCustomizer';

const WidgetCustomizerRouter = ({ isOpen, onClose, onSave, widget }) => {
  if (!isOpen || !widget) return null;

  const customizerProps = { isOpen, onClose, onSave, widget };

  switch (widget.type) {
    case 'metric':
      return <MetricCustomizer {...customizerProps} />;
    case 'chart':
      return <ChartCustomizer {...customizerProps} />;
    case 'gauge':
      return <GaugeCustomizer {...customizerProps} />;
    case 'switch':
      return <SwitchCustomizer {...customizerProps} />;
    default:
      return null;
  }
};

export default WidgetCustomizerRouter;