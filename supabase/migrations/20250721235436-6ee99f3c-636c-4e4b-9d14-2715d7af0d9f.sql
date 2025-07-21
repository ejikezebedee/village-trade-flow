-- Insert sample flash sales data directly
INSERT INTO public.flash_sales (
    title, 
    description, 
    product_id, 
    original_price, 
    sale_price, 
    start_time, 
    end_time, 
    quantity_available,
    quantity_sold,
    featured,
    created_by
) VALUES
('Flash Sale: Premium Wireless Headphones', 'Limited time offer! Get these amazing headphones at an unbeatable price. Don''t miss out!', 
 (SELECT id FROM public.products WHERE name LIKE '%Headphones%' LIMIT 1), 199.99, 149.99, 
 NOW() - INTERVAL '1 hour', NOW() + INTERVAL '6 hours', 16, 3, true, 
 (SELECT id FROM auth.users LIMIT 1)),

('Flash Sale: Organic Coffee Beans', 'Limited time offer! Get these amazing coffee beans at an unbeatable price. Don''t miss out!', 
 (SELECT id FROM public.products WHERE name LIKE '%Coffee%' LIMIT 1), 24.99, 14.99, 
 NOW() - INTERVAL '1 hour', NOW() + INTERVAL '12 hours', 33, 10, false, 
 (SELECT id FROM auth.users LIMIT 1)),

('Flash Sale: Smart Fitness Watch', 'Limited time offer! Get this amazing smartwatch at an unbeatable price. Don''t miss out!', 
 (SELECT id FROM public.products WHERE name LIKE '%Watch%' LIMIT 1), 299.99, 199.99, 
 NOW() - INTERVAL '1 hour', NOW() + INTERVAL '3 hours', 10, 7, true, 
 (SELECT id FROM auth.users LIMIT 1)),

('Flash Sale: Handwoven Basket', 'Limited time offer! Get this amazing basket at an unbeatable price. Don''t miss out!', 
 (SELECT id FROM public.products WHERE name LIKE '%Basket%' LIMIT 1), 45.00, 29.99, 
 NOW() - INTERVAL '1 hour', NOW() + INTERVAL '8 hours', 8, 2, false, 
 (SELECT id FROM auth.users LIMIT 1)),

('Flash Sale: Organic Honey', 'Limited time offer! Get this amazing honey at an unbeatable price. Don''t miss out!', 
 (SELECT id FROM public.products WHERE name LIKE '%Honey%' LIMIT 1), 18.99, 12.99, 
 NOW() - INTERVAL '1 hour', NOW() + INTERVAL '4 hours', 25, 8, false, 
 (SELECT id FROM auth.users LIMIT 1)),

('Flash Sale: Bluetooth Speaker', 'Limited time offer! Get this amazing speaker at an unbeatable price. Don''t miss out!', 
 (SELECT id FROM public.products WHERE name LIKE '%Speaker%' LIMIT 1), 89.99, 59.99, 
 NOW() - INTERVAL '1 hour', NOW() + INTERVAL '24 hours', 13, 1, false, 
 (SELECT id FROM auth.users LIMIT 1));