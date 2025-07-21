# Analytics Integration Guide

This guide explains how to set up and use the analytics system integrated into your marketplace platform.

## Features

### Tracking Capabilities
- **User Analytics**: Track user sessions, page views, and custom events
- **Product Analytics**: Monitor product views, clicks, favorites, and purchases
- **Conversion Funnel**: Track user journey from awareness to purchase
- **Real-time Dashboard**: Admin dashboard with live analytics data
- **Google Analytics Integration**: Optional GA4 integration

### Analytics Dashboard
Access the analytics dashboard through the Admin panel:
- Navigate to Admin Dashboard → Analytics tab
- View key metrics: users, sessions, page views, conversions, revenue
- Analyze product performance and user behavior
- Monitor conversion funnel and user engagement

## Setup Instructions

### 1. Google Analytics Integration (Optional)

To integrate with Google Analytics 4:

1. Create a GA4 property in Google Analytics
2. Get your Measurement ID (format: G-XXXXXXXXXX)
3. Add the ID to your environment variables:
   ```bash
   # In your .env file (if using environment variables)
   VITE_GA_TRACKING_ID=G-XXXXXXXXXX
   ```
4. The system will automatically initialize GA4 tracking

### 2. Database Analytics

The system automatically tracks events to the database:
- User sessions and page views
- Product interactions (views, clicks, favorites)
- Conversion events and funnel stages
- Daily aggregated metrics

### 3. Custom Event Tracking

Use the analytics hooks in your components:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { trackEvent, trackProductEvent, trackConversion } = useAnalytics();

  const handleCustomEvent = () => {
    trackEvent('custom', 'button_click', {
      button_name: 'special_offer',
      page: 'homepage'
    });
  };

  const handleProductView = (productId: string) => {
    trackProductEvent(productId, 'view', {
      name: 'Product Name',
      category: 'Electronics',
      price: 99.99
    });
  };

  const handlePurchase = (orderId: string, value: number) => {
    trackConversion('purchase', 'order_completed', value, orderId);
  };
}
```

## Tracked Events

### Automatic Events
- Page views on all routes
- User sessions (start/end)
- Product card views and clicks
- Search queries
- User authentication events

### E-commerce Events
- Product views and clicks
- Add to cart/favorites
- Purchase completions
- Order tracking updates

### Engagement Events
- Button clicks and interactions
- Form submissions
- File downloads
- Social sharing

## Analytics Dashboard Features

### Key Metrics
- **Daily Active Users**: Unique users per day
- **Sessions**: Total user sessions
- **Page Views**: Total page views
- **Conversions**: Completed orders
- **Revenue**: Total sales revenue

### Product Analytics
- Top performing products
- Product view/click/purchase rates
- Category performance
- Search trends

### Conversion Funnel
- Awareness → Interest → Consideration → Purchase → Retention
- Conversion rates between stages
- Drop-off analysis

### User Behavior
- Session duration and bounce rates
- Popular pages and user paths
- Device and browser analytics
- Traffic sources (direct, organic, social, referral)

## Data Privacy & Compliance

### GDPR Compliance
- Analytics tracking respects user consent
- No personal data stored without permission
- Users can opt-out of tracking

### Data Retention
- Raw analytics data: 90 days
- Aggregated data: 2 years
- User sessions: 30 days

## Monitoring & Maintenance

### Regular Tasks
1. **Daily**: Monitor key metrics in the dashboard
2. **Weekly**: Review product performance and popular content
3. **Monthly**: Analyze conversion funnel and user behavior trends
4. **Quarterly**: Generate comprehensive analytics reports

### Data Quality
- Automated daily aggregation of analytics data
- Data validation and error handling
- Backup and recovery procedures

## Troubleshooting

### Common Issues

**Analytics not tracking:**
- Check that AnalyticsProvider is properly wrapped around your app
- Verify user permissions for database writes
- Check browser console for JavaScript errors

**Google Analytics not working:**
- Verify your GA tracking ID is correct
- Check that GA scripts are loading (no ad blockers)
- Ensure your domain is configured in GA settings

**Dashboard not loading data:**
- Verify admin permissions in the database
- Check for RLS policy restrictions
- Run the daily analytics aggregation manually

### Support
For additional support or custom analytics requirements, contact your development team.