import { Deal, Message } from './types';

export const DEALS: Deal[] = [
  {
    id: '1',
    title: 'Global Infrastructure Inc.',
    subtitle: 'Industrial Equipment Bulk...',
    priority: 'HIGH',
    status: 'Negotiating',
    price: '$42,500',
    time: '2m ago',
  },
  {
    id: '2',
    title: 'Artisan Cooperatives Ltd.',
    subtitle: 'Raw Material Sourcing',
    priority: 'STANDARD',
    status: 'Waiting',
    price: '$12,800',
    time: '1h ago',
  },
  {
    id: '3',
    title: 'Lumina Tech Solutions',
    subtitle: 'Software License Agreement',
    priority: 'NEW',
    status: 'New Offer',
    price: '$3,200',
    time: '4h ago',
  },
];

export const MESSAGES: Message[] = [
  {
    id: '1',
    sender: 'partner',
    text: 'Greetings. We have reviewed your initial proposal for the heavy machinery shipment. The current price point is slightly above our allocated capital for this quarter.',
    time: '10:45 AM',
  },
  {
    id: '2',
    sender: 'me',
    text: 'Understood. We can offer a volume discount if the order quantity is increased by 15 units. Alternatively, we could extend the payment terms to 60 days.',
    time: '10:52 AM',
  },
];
