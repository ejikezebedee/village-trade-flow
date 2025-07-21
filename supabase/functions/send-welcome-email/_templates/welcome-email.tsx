import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Button,
  Hr,
  Img,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface WelcomeEmailProps {
  userEmail: string;
  firstName: string;
  lastName: string;
  userType: string;
  emailType: string;
  appUrl: string;
}

export const WelcomeEmail = ({
  userEmail = "user@example.com",
  firstName = "User",
  lastName = "",
  userType = "buyer",
  emailType = "welcome",
  appUrl = "https://yourapp.com",
}: WelcomeEmailProps) => {
  const previewText = emailType === "welcome" 
    ? `Welcome to VillageMarket, ${firstName}!` 
    : emailType === "profile_updated"
    ? "Your profile has been updated"
    : `You're now registered as a ${userType}`;

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "buyer":
        return "You can now browse and purchase products from rural sellers, supporting local communities while getting fresh, authentic goods.";
      case "seller":
        return "You can now list your products and reach urban markets, expanding your customer base beyond your local area.";
      case "driver":
        return "You can now accept delivery jobs and help connect rural sellers with urban buyers while earning income.";
      case "agent":
        return "You can now help other users navigate the platform and facilitate transactions in your community.";
      default:
        return "You can now access all the features available for your role.";
    }
  };

  const getEmailContent = () => {
    switch (emailType) {
      case "welcome":
        return {
          title: `Welcome to VillageMarket, ${firstName}!`,
          content: (
            <>
              <Text style={paragraph}>
                Thank you for joining VillageMarket! We're excited to have you as part of our community that connects rural producers with urban consumers.
              </Text>
              <Text style={paragraph}>
                You've successfully registered as a <strong>{userType}</strong>. {getRoleDescription(userType)}
              </Text>
              <Section style={btnContainer}>
                <Button style={button} href={`${appUrl}`}>
                  Get Started
                </Button>
              </Section>
            </>
          )
        };
      case "profile_updated":
        return {
          title: "Profile Updated Successfully",
          content: (
            <>
              <Text style={paragraph}>
                Hi {firstName}, your profile has been successfully updated.
              </Text>
              <Text style={paragraph}>
                Your current role: <strong>{userType}</strong>
              </Text>
              <Text style={paragraph}>
                {getRoleDescription(userType)}
              </Text>
            </>
          )
        };
      case "role_assigned":
        return {
          title: `You're now a ${userType}!`,
          content: (
            <>
              <Text style={paragraph}>
                Hi {firstName}, your role has been updated to <strong>{userType}</strong>.
              </Text>
              <Text style={paragraph}>
                {getRoleDescription(userType)}
              </Text>
              <Section style={btnContainer}>
                <Button style={button} href={`${appUrl}`}>
                  Explore Your Dashboard
                </Button>
              </Section>
            </>
          )
        };
      default:
        return {
          title: "Welcome to VillageMarket",
          content: (
            <Text style={paragraph}>
              Thank you for joining VillageMarket!
            </Text>
          )
        };
    }
  };

  const emailContent = getEmailContent();

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Heading style={h1}>🏪 VillageMarket</Heading>
          </Section>
          
          <Heading style={h1}>{emailContent.title}</Heading>
          
          {emailContent.content}
          
          <Hr style={hr} />
          
          <Section style={infoSection}>
            <Text style={paragraph}>
              <strong>What's Next?</strong>
            </Text>
            <Text style={paragraph}>
              • Complete your profile verification for full access
              • Explore the marketplace and discover amazing products
              • Connect with your local community
              • Start {userType === "buyer" ? "shopping" : userType === "seller" ? "selling" : userType === "driver" ? "delivering" : "helping others"}!
            </Text>
          </Section>
          
          <Hr style={hr} />
          
          <Text style={paragraph}>
            Need help? Reply to this email or visit our help center.
          </Text>
          
          <Text style={footer}>
            <Link href={appUrl} target="_blank" style={{ ...link, color: '#898989' }}>
              VillageMarket
            </Link>
            <br />
            Connecting rural communities with urban markets
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
};

const logoContainer = {
  textAlign: 'center' as const,
  margin: '0 0 20px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '30px 0',
  padding: '0',
  lineHeight: '42px',
};

const paragraph = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const btnContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#000',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px',
  maxWidth: '200px',
  margin: '0 auto',
};

const link = {
  color: '#2754C5',
  textDecoration: 'underline',
};

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
};

const infoSection = {
  backgroundColor: '#f6f9fc',
  borderRadius: '4px',
  padding: '24px',
  margin: '32px 0',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '48px 0 0',
};