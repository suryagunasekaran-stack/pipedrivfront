interface StatusBadgeProps {
  status: 'healthy' | 'warning' | 'critical' | 'connected' | 'disconnected' | 'error' | 'success' | 'pending' | 'excellent' | 'low' | 'medium' | 'high' | 'good' | 'unknown' | string;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, text, size = 'md' }: StatusBadgeProps) {
  const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    healthy: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-400',
      label: text || 'Healthy',
    },
    connected: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-400',
      label: text || 'Connected',
    },
    success: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-400',
      label: text || 'Success',
    },
    excellent: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-400',
      label: text || 'Excellent',
    },
    good: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-400',
      label: text || 'Good',
    },
    low: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-400',
      label: text || 'Low',
    },
    warning: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      dot: 'bg-yellow-400',
      label: text || 'Warning',
    },
    pending: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      dot: 'bg-yellow-400',
      label: text || 'Pending',
    },
    medium: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      dot: 'bg-yellow-400',
      label: text || 'Medium',
    },
    critical: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      dot: 'bg-red-400',
      label: text || 'Critical',
    },
    disconnected: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      dot: 'bg-red-400',
      label: text || 'Disconnected',
    },
    error: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      dot: 'bg-red-400',
      label: text || 'Error',
    },
    high: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      dot: 'bg-red-400',
      label: text || 'High',
    },
    unknown: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      dot: 'bg-gray-400',
      label: text || 'Unknown',
    },
  };

  const sizeConfig = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.text} ${sizeConfig[size]}`}
    >
      <svg
        className={`-ml-0.5 mr-1.5 h-2 w-2 ${config.dot}`}
        fill="currentColor"
        viewBox="0 0 8 8"
      >
        <circle cx={4} cy={4} r={3} />
      </svg>
      {config.label}
    </span>
  );
} 