declare module "@totalolage/node-spotify-api" {
    interface API_response {
        [key: any]: any;
    };

    interface request_options {
        method?: "GET" | "PUT" | "POST" | "DELETE";
        callback?: () => void;
    }

    class Spotify {
        constructor({
            id: string,
            secret: string,
        });

        request: (url: string, options: request_options) => Promise<API_response>;
    }

    export default Spotify;
}