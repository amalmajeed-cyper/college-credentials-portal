require 'webrick'
require 'json'
require 'net/smtp'
require 'base64'

STDOUT.sync = true
STDERR.sync = true

# Parse manual .env configuration file
def load_env
  env_path = File.join(Dir.pwd, '.env')
  if File.exist?(env_path)
    File.readlines(env_path).each do |line|
      line = line.strip
      next if line.empty? || line.start_with?('#')
      key, val = line.split('=', 2)
      if key && val
        ENV[key.strip] = val.strip.sub(/\A["']/, '').sub(/["']\z/, '')
      end
    end
  end
end

load_env

# Helper: Send plain OTP email via Net::SMTP
def send_otp_email(to_email, otp)
  smtp_host = ENV['SMTP_HOST'] || 'smtp.gmail.com'
  smtp_port = (ENV['SMTP_PORT'] || 587).to_i
  smtp_user = ENV['SMTP_USER']
  smtp_pass = ENV['SMTP_PASS']
  from_email = ENV['FROM_EMAIL'] || 'registrar@college.edu'

  if !smtp_user || smtp_user.empty? || smtp_user.include?('your-email')
    raise "SMTP user credentials are not configured in the .env file."
  end

  mailtext = <<~EOF
    From: #{from_email}
    To: #{to_email}
    Subject: Verify Your Email - Institute of Advanced Study
    MIME-Version: 1.0
    Content-Type: text/html; charset="UTF-8"

    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #1e3a8a; margin: 0;">Institute of Advanced Study</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Student Portal Email Verification</p>
      </div>
      
      <div style="padding: 10px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        <p>Dear Student,</p>
        <p>Thank you for initiating your account registration with the Student Credentials Portal. Please use the following 6-digit verification code to complete your sign-up:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; color: #f59e0b; background-color: #fef3c7; padding: 10px 30px; border-radius: 8px; letter-spacing: 5px; border: 1px dashed #f59e0b;">
            #{otp}
          </span>
        </div>
        
        <p>This code will expire in 20 minutes. If you did not request this code, you can safely ignore this email.</p>
      </div>
      
      <div style="border-top: 1px solid #e1e4e8; padding-top: 15px; margin-top: 30px; text-align: center; font-size: 12px; color: #9ca3af;">
        <p>© 2026 Institute of Advanced Study. All rights reserved.</p>
        <p>This is an automated system email. Please do not reply directly to this mail.</p>
      </div>
    </div>
  EOF

  smtp = Net::SMTP.new(smtp_host, smtp_port)
  smtp.enable_starttls if smtp.respond_to?(:enable_starttls)
  smtp.start('localhost', smtp_user, smtp_pass, :login) do |smtp_conn|
    smtp_conn.send_message(mailtext, smtp_user, to_email)
  end
end

# Helper: Send congratulations email with PDF certificate attachment
def send_certificate_email(to_email, name, college_id, pdf_base64)
  smtp_host = ENV['SMTP_HOST'] || 'smtp.gmail.com'
  smtp_port = (ENV['SMTP_PORT'] || 587).to_i
  smtp_user = ENV['SMTP_USER']
  smtp_pass = ENV['SMTP_PASS']
  from_email = ENV['FROM_EMAIL'] || 'registrar@college.edu'

  if !smtp_user || smtp_user.empty? || smtp_user.include?('your-email')
    raise "SMTP user credentials are not configured in the .env file."
  end

  boundary = "CertificateBoundaryLine12345"

  mailtext = <<~EOF
    From: #{from_email}
    To: #{to_email}
    Subject: Your Google AI Professional Certificate - Academic Portal
    MIME-Version: 1.0
    Content-Type: multipart/mixed; boundary="#{boundary}"

    --#{boundary}
    Content-Type: text/html; charset="UTF-8"
    Content-Transfer-Encoding: 7bit

    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #1e3a8a; margin: 0;">Institute of Advanced Study</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Digital Credentials Dispatch</p>
      </div>
      
      <div style="padding: 10px 0; color: #374151; font-size: 16px; line-height: 1.6;">
        <p>Dear <strong>#{name}</strong>,</p>
        
        <p>Congratulations! We are pleased to formally issue your digital academic credential. Having successfully completed all course assessments and assessments prescribed by the institute, you have earned the <strong>Google AI Professional Certification</strong>.</p>
        
        <div style="background-color: #f0f7ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="margin: 0 0 8px 0; color: #1e3a8a;">Issued Credential Summary</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 4px 0; color: #6b7280; width: 120px;">Recipient Name:</td>
              <td style="padding: 4px 0; font-weight: bold; color: #111827;">#{name}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">College ID:</td>
              <td style="padding: 4px 0; font-weight: bold; color: #111827; font-family: monospace;">#{college_id}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6b7280;">Issuance Date:</td>
              <td style="padding: 4px 0; font-weight: bold; color: #111827;">8 July 2026</td>
            </tr>
          </table>
        </div>
        
        <p>Your official academic certificate has been compiled as a secure PDF and is attached to this email.</p>
        
        <p>We wish you the very best in your academic and professional endeavors.</p>
      </div>
      
      <div style="border-top: 1px solid #e1e4e8; padding-top: 15px; margin-top: 30px; text-align: center; font-size: 12px; color: #9ca3af;">
        <p>© 2026 Institute of Advanced Study. All rights reserved.</p>
        <p>Institute of Advanced Study, Credentials Portal.</p>
      </div>
    </div>

    --#{boundary}
    Content-Type: application/pdf; name="Google_AI_Certificate.pdf"
    Content-Transfer-Encoding: base64
    Content-Disposition: attachment; filename="Google_AI_Certificate.pdf"

    #{pdf_base64}
    --#{boundary}--
  EOF

  smtp = Net::SMTP.new(smtp_host, smtp_port)
  smtp.enable_starttls if smtp.respond_to?(:enable_starttls)
  smtp.start('localhost', smtp_user, smtp_pass, :login) do |smtp_conn|
    smtp_conn.send_message(mailtext, smtp_user, to_email)
  end
end

# WEBrick API Servlet Class
class ApiServlet < WEBrick::HTTPServlet::AbstractServlet
  def do_POST(req, res)
    res.content_type = 'application/json'
    
    # Allow CORS
    res['Access-Control-Allow-Origin'] = '*'
    res['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    res['Access-Control-Allow-Headers'] = 'Content-Type'
    
    begin
      data = JSON.parse(req.body || '{}')
      
      case req.path
      when '/api/send-otp'
        email = data['email']
        otp = data['otp']
        
        if !email || !otp
          res.status = 400
          res.body = { success: false, error: 'Email and OTP code are required.' }.to_json
          return
        end
        
        send_otp_email(email, otp)
        res.status = 200
        res.body = { success: true }.to_json
        
      when '/api/send-certificate'
        email = data['email']
        name = data['name']
        college_id = data['collegeId']
        pdf_base64 = data['pdfBase64']
        
        if !email || !name || !college_id || !pdf_base64
          res.status = 400
          res.body = { success: false, error: 'Email, Name, College ID, and pdfBase64 attachment are required.' }.to_json
          return
        end
        
        send_certificate_email(email, name, college_id, pdf_base64)
        res.status = 200
        res.body = { success: true }.to_json
        
      else
        res.status = 404
        res.body = { success: false, error: 'Endpoint not found.' }.to_json
      end
      
    rescue => e
      puts "Server Error: #{e.message}"
      puts e.backtrace.join("\n")
      res.status = 500
      error_msg = e.message.to_s.force_encoding('UTF-8').scrub
      res.body = { success: false, error: error_msg }.to_json
    end
  end

  # Handle CORS pre-flight
  def do_OPTIONS(req, res)
    res.status = 204
    res['Access-Control-Allow-Origin'] = '*'
    res['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    res['Access-Control-Allow-Headers'] = 'Content-Type'
    res.body = ''
  end
end

# Initialize Web Server (serving static files by default and mounting API servlet)
port = ENV['PORT'] ? ENV['PORT'].to_i : 3000
server = WEBrick::HTTPServer.new(
  Port: port,
  DocumentRoot: Dir.pwd,
  MaxBodySize: 20 * 1024 * 1024
)

# Mount endpoints to the Servlet
server.mount '/api/send-otp', ApiServlet
server.mount '/api/send-certificate', ApiServlet

# Graceful shutdown handler
trap 'INT' do 
  server.shutdown 
end

puts "=========================================================="
puts "College Portal Server successfully initialized (Ruby)"
puts "Serving static credentials portal on http://localhost:#{port}"
puts "Press Ctrl+C to terminate the server process."
puts "=========================================================="

server.start
