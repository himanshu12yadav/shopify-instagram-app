export class InstagramService {
  constructor(accessToken){
    this.accessToken = accessToken;
    this.baseUrl = "https://graph.instagram.com"
  }

  async getProfile(){
    const response = await fetch(`${this.baseUrl}/me?fields=id,username&access_token=${this.accessToken}`);
    return response.json();
  }

  async getPosts(){
    const response = await fetch(`${this.baseUrl}/me/media?fields=id,media_type,media_url,permalink,thumbnail_url,timestamp,caption&access_token=${this.accessToken}`);
    return response.json();
  }
}
