package ca.bc.gov.gradsandbox.utils;

import org.springframework.beans.factory.annotation.Value;
import com.jcraft.jsch.*;
import org.springframework.stereotype.Component;

@Component
public class SFTPUtils {
    @Value("${sftp.remote.host}")
    private String REMOTE_HOST;
    @Value("${sftp.username}")
    private String SFTP_USERNAME;
    private static final int REMOTE_PORT = 22;
    private static final int SESSION_TIMEOUT = 10000;
    private static final int CHANNEL_TIMEOUT = 5000;

    public boolean sftpUpload() {
        String localFile = "/app/static/upload-this.file";
        String remoteFile = "/Inbox/Dev/uploaded-this.file";
        Session jschSession = null;

        try {
            JSch jsch = new JSch();
            jsch.setKnownHosts("/.ssh/known_hosts");
            //jsch.setKnownHosts("/home/" + SFTP_USERNAME + "/.ssh/known_hosts");
            //jsch.setKnownHosts("C:\\Users\\kamal.mohammed\\.ssh\\known_hosts");
            jschSession = jsch.getSession(SFTP_USERNAME, REMOTE_HOST, REMOTE_PORT);

            // authenticate using private key
            jsch.addIdentity("/.ssh/id_rsa");
            //jsch.addIdentity("/home/" + SFTP_USERNAME + "/.ssh/id_rsa");
            //jsch.addIdentity("C:\\Users\\kamal.mohammed\\.ssh\\id_rsa");
            jschSession.connect(SESSION_TIMEOUT);

            Channel sftp = jschSession.openChannel("sftp");
            sftp.connect(CHANNEL_TIMEOUT);
            ChannelSftp channelSftp = (ChannelSftp) sftp;

            // transfer file from local to remote server
            channelSftp.put(localFile, remoteFile);
            channelSftp.exit();
            return true;
        } catch (JSchException | SftpException e) {
            e.printStackTrace();
            return false;
        } finally {
            if (jschSession != null) {
                jschSession.disconnect();
            }
        }
    }
}
