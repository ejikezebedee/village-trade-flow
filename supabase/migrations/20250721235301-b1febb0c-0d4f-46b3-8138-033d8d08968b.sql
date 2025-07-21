-- Insert sample products first (needed for flash sales)
INSERT INTO public.products (name, description, price, category, stock_quantity, seller_id, images, is_active) VALUES
('Premium Wireless Headphones', 'High-quality wireless headphones with noise cancellation', 199.99, 'electronics', 50, (SELECT id FROM auth.users LIMIT 1), '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"]', true),
('Organic Coffee Beans', 'Freshly roasted organic coffee beans from Kenya', 24.99, 'food', 100, (SELECT id FROM auth.users LIMIT 1), '["https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500"]', true),
('Smart Fitness Watch', 'Track your health and fitness with this advanced smartwatch', 299.99, 'electronics', 30, (SELECT id FROM auth.users LIMIT 1), '["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"]', true),
('Handwoven Basket', 'Beautiful handwoven basket made by local artisans', 45.00, 'crafts', 25, (SELECT id FROM auth.users LIMIT 1), '["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500"]', true),
('Organic Honey', 'Pure, unfiltered organic honey from local beekeepers', 18.99, 'food', 75, (SELECT id FROM auth.users LIMIT 1), '["https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500"]', true),
('Bluetooth Speaker', 'Portable wireless speaker with amazing sound quality', 89.99, 'electronics', 40, (SELECT id FROM auth.users LIMIT 1), '["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500"]', true);

-- Insert flash sales using the newly created products
INSERT INTO public.flash_sales (
    title, 
    description, 
    product_id, 
    original_price, 
    sale_price, 
    start_time, 
    end_time, 
    quantity_available,
    featured,
    created_by
) 
SELECT 
    'Flash Sale: ' || p.name,
    'Limited time offer! Get this amazing product at an unbeatable price. Don''t miss out!',
    p.id,
    p.price,
    CASE 
        WHEN p.name LIKE '%Headphones%' THEN 149.99
        WHEN p.name LIKE '%Coffee%' THEN 14.99
        WHEN p.name LIKE '%Watch%' THEN 199.99
        WHEN p.name LIKE '%Basket%' THEN 29.99
        WHEN p.name LIKE '%Honey%' THEN 12.99
        WHEN p.name LIKE '%Speaker%' THEN 59.99
    END,
    NOW() - INTERVAL '1 hour',
    CASE 
        WHEN p.name LIKE '%Headphones%' THEN NOW() + INTERVAL '6 hours'
        WHEN p.name LIKE '%Coffee%' THEN NOW() + INTERVAL '12 hours'
        WHEN p.name LIKE '%Watch%' THEN NOW() + INTERVAL '3 hours'
        WHEN p.name LIKE '%Basket%' THEN NOW() + INTERVAL '8 hours'
        WHEN p.name LIKE '%Honey%' THEN NOW() + INTERVAL '4 hours'
        WHEN p.name LIKE '%Speaker%' THEN NOW() + INTERVAL '24 hours'
    END,
    FLOOR(p.stock_quantity / 3),
    CASE 
        WHEN p.name LIKE '%Headphones%' THEN true
        WHEN p.name LIKE '%Watch%' THEN true
        ELSE false
    END,
    (SELECT id FROM auth.users LIMIT 1)
FROM public.products p
WHERE p.is_active = true
LIMIT 6;

-- Update some sales with purchases to show activity
UPDATE public.flash_sales 
SET quantity_sold = FLOOR(quantity_available * 0.3)
WHERE title LIKE '%Coffee%' OR title LIKE '%Honey%';

UPDATE public.flash_sales 
SET quantity_sold = FLOOR(quantity_available * 0.7)
WHERE title LIKE '%Watch%';