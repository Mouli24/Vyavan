export interface Deal {
  id: string;
  title: string;
  subtitle: string;
  priority: 'HIGH' | 'STANDARD' | 'NEW';
  status: 'Negotiating' | 'Waiting' | 'New Offer';
  price: string;
  time: string;
}

export interface Message {
  id: string;
  sender: 'partner' | 'me';
  text: string;
  time: string;
}
