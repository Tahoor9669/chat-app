export interface PromotionResponse {
    message: string;
    request: {
        _id: string;
        status: string;
    };
}

export interface PromotionRequest {
    _id: string;
    userId: {
        _id: string;
        username: string;
    };
    groupId: {
        _id: string;
        name: string;
    };
    status: 'pending' | 'approved' | 'rejected';
    requestDate: Date;
}

export interface PromotionError {
    message: string;
    error: string;
}