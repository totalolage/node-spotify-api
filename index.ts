const rp =  require("request-promise");
const TOKEN_URI = "https://accounts.spotify.com/api/token";
const SEARCH_URI = "https://api.spotify.com/v1/search?type=";

type callbackT = (err: string | {} | null, body: string | {} | null) => void;
type methodT = "GET" | "POST" | "PUT" | "DELETE";

class Spotify {
  constructor(credentials: Spotify["credentials"]) {
    if (!credentials || !credentials.id || !credentials.secret) {
      throw new Error(
        'Could not initialize Spotify client. You must supply an object containing your Spotify client "id" and "secret".'
      );
    }
    this.credentials = { id: credentials.id, secret: credentials.secret };
  }

  credentials: {id: string, secret: string};
  token?: {
      expires_in: number;
      expires_at: number;
      access_token: string;
  };

  search(
      search: {
          type: string;
          query: string;
          limit: number;
      },
      callback: callbackT
) {
    let request;
    const opts = {
      method: "GET",
      uri:
        SEARCH_URI +
        search.type +
        "&q=" +
        encodeURIComponent(search.query) +
        "&limit=" +
        (search.limit || "20"),
      json: true,
      headers: undefined as ReturnType<Spotify["getTokenHeader"]> | undefined,
    };

    if (!search || !search.type || !search.query) {
      throw new Error("You must specify a type and query for your search.");
    }

    if (
      !this.token ||
      !this.token.expires_in ||
      !this.token.expires_at ||
      !this.token.access_token ||
      this.isTokenExpired()
    ) {
      request = this.setToken().then(() => {
        opts.headers = this.getTokenHeader();
        return rp(opts);
      });
    } else {
      opts.headers = this.getTokenHeader();
      request = rp(opts);
    }

    if (callback) {
      request
        .then((response: Parameters<callbackT>[1]) => callback(null, response))
        .catch((err: Parameters<callbackT>[0]) => callback(err, null));
    } else {
      return request;
    }
  }

  request(query: string, {callback, method = "GET"}: {callback?: callbackT, method?: methodT}) {
    if (!query || typeof query !== "string") {
      throw new Error(
        "You must pass in a Spotify API endpoint to use this method."
      );
    }
    let request;
    const opts = {
        method,
        uri: query,
        json: true,
        headers: undefined as undefined | ReturnType<Spotify["getCredentialHeader"]>
    };

    if (
      !this.token ||
      !this.token.expires_in ||
      !this.token.expires_at ||
      !this.token.access_token ||
      this.isTokenExpired()
    ) {
      request = this.setToken().then(() => {
        opts.headers = this.getTokenHeader();
        return rp(opts);
      });
    } else {
      opts.headers = this.getTokenHeader();
      request = rp(opts);
    }

    if (callback) {
      request
        .then((response: Parameters<callbackT>[1]) => callback(null, response))
        .catch((err: Parameters<callbackT>[0]) => callback(err, null));
    } else {
      return request;
    }
  }

  isTokenExpired() {
    if (this.token) {
      if (Date.now() / 1000 >= this.token.expires_at - 300) {
        return true;
      }
    }
    return false;
  }

  setToken() {
    const opts = {
      method: "POST",
      uri: TOKEN_URI,
      form: { grant_type: "client_credentials" },
      headers: this.getCredentialHeader(),
      json: true
    };
    return rp(opts).then((token: NonNullable<Spotify["token"]>) => {
      this.token = token;
      const currentTime = new Date();
      const expireTime = new Date(+currentTime);
      return (this.token.expires_at =
        +expireTime / 1000 + this.token.expires_in);
    });
  }

  getTokenHeader() {
    if (!this.token || !this.token.access_token) {
      throw new Error(
        "An error has occurred. Make sure you're using a valid client id and secret.'"
      );
    }
    return { Authorization: "Bearer " + this.token.access_token };
  }

  getCredentialHeader() {
    return {
      Authorization:
        "Basic " +
        Buffer.from(
          this.credentials.id + ":" + this.credentials.secret
        , "ascii").toString("base64")
    };
  }
}

export default Spotify;
