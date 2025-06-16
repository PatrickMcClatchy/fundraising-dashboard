-- Create campaigns table
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  goal DECIMAL(10,2) NOT NULL,
  raised DECIMAL(10,2) DEFAULT 0,
  backers INTEGER DEFAULT 0,
  days_left INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create donations table
CREATE TABLE donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  amount DECIMAL(10,2) NOT NULL,
  donor_name VARCHAR(255),
  donor_email VARCHAR(255),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample campaign
INSERT INTO campaigns (name, description, goal, raised, backers, days_left)
VALUES (
  'Community Gaming Setup',
  'Help us build an amazing gaming setup for our Discord community!',
  5000.00,
  3250.00,
  127,
  15
);

-- Create function to update campaign totals
CREATE OR REPLACE FUNCTION update_campaign_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE campaigns 
  SET 
    raised = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM donations 
      WHERE campaign_id = NEW.campaign_id
    ),
    backers = (
      SELECT COUNT(*) 
      FROM donations 
      WHERE campaign_id = NEW.campaign_id
    ),
    updated_at = NOW()
  WHERE id = NEW.campaign_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update totals
CREATE TRIGGER update_campaign_totals_trigger
  AFTER INSERT ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_totals();
