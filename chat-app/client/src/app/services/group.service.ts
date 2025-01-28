import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { PromotionRequest, PromotionResponse } from '../models/promotion.models';

@Injectable({
    providedIn: 'root'
})
export class GroupService {
    private apiUrl = 'http://localhost:3000/api/groups';

    constructor(private http: HttpClient) {}

    private getHeaders(): HttpHeaders {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        console.log('Current user in headers:', currentUser);
        return new HttpHeaders({
            'Authorization': `Bearer ${currentUser.token}`,
            'Content-Type': 'application/json'
        });
    }

    getGroups(): Observable<any[]> {
        console.log('Getting groups...');
        return this.http.get<any[]>(this.apiUrl, {
            headers: this.getHeaders()
        }).pipe(
            tap(groups => console.log('Received groups:', groups)),
            catchError(error => {
                console.error('Error in getGroups:', error);
                return throwError(() => error);
            })
        );
    }

    checkGroupName(name: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/check-name/${encodeURIComponent(name)}`, {
            headers: this.getHeaders()
        }).pipe(
            catchError(this.handleError)
        );
    }

    createGroup(groupData: any): Observable<any> {
        return this.http.post(this.apiUrl, groupData, {
            headers: this.getHeaders()
        }).pipe(
            catchError(this.handleError)
        );
    }

    deleteGroup(groupId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${groupId}`, {
            headers: this.getHeaders()
        }).pipe(
            catchError(this.handleError)
        );
    }

    joinGroup(groupId: string): Observable<any> {
        console.log('Sending join request for group:', groupId);
        return this.http.post(`${this.apiUrl}/${groupId}/request-join`, {}, {
            headers: this.getHeaders()
        }).pipe(
            tap(response => console.log('Join request response:', response)),
            catchError(this.handleError)
        );
    }

    leaveGroup(groupId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${groupId}/leave`, {}, {
            headers: this.getHeaders()
        }).pipe(
            catchError(this.handleError)
        );
    }

    addMember(groupId: string, userId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${groupId}/members`, { userId }, {
            headers: this.getHeaders()
        }).pipe(
            catchError(this.handleError)
        );
    }

    addChannel(groupId: string, channelData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/${groupId}/channels`, channelData, {
            headers: this.getHeaders()
        }).pipe(
            catchError(this.handleError)
        );
    }

    requestGroupAdminPromotion(groupId: string): Observable<PromotionResponse> {
        return this.http.post<PromotionResponse>(`${this.apiUrl}/${groupId}/request-promotion`, {}, {
            headers: this.getHeaders()
        }).pipe(
            catchError(this.handleError)
        );
    }

    handlePromotionRequest(requestId: string, action: 'approve' | 'reject'): Observable<PromotionResponse> {
        return this.http.post<PromotionResponse>(`${this.apiUrl}/promotion-requests/${requestId}/handle`, { action }, {
            headers: this.getHeaders()
        }).pipe(
            catchError(this.handleError)
        );
    }

    getPendingPromotionRequests(): Observable<PromotionRequest[]> {
        return this.http.get<PromotionRequest[]>(`${this.apiUrl}/promotion-requests/pending`, {
            headers: this.getHeaders()
        }).pipe(
            catchError(this.handleError)
        );
    }

    handleJoinRequest(groupId: string, userId: string, action: 'approve' | 'reject'): Observable<any> {
        return this.http.put(
            `${this.apiUrl}/${groupId}/join-requests/${userId}`,
            { action },
            { headers: this.getHeaders() }
        ).pipe(
            tap(response => {
                console.log('Server response:', response);
                this.getGroups().subscribe();
            }),
            catchError(this.handleError)
        );
    }
    
    getPendingJoinRequests(groupId: string): Observable<any[]> {
        console.log('Fetching pending requests for group:', groupId);
        return this.http.get<any[]>(`${this.apiUrl}/${groupId}/join-requests/pending`, {
            headers: this.getHeaders()
        }).pipe(
            tap(requests => console.log('Received requests:', requests)),
            catchError(this.handleError)
        );
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'An error occurred';
        if (error.error instanceof ErrorEvent) {
            errorMessage = error.error.message;
        } else {
            errorMessage = error.error.error || error.message;
        }
        return throwError(() => new Error(errorMessage));
    }

    promoteToGroupAdmin(groupId: string, userId: string): Observable<any> {
        return this.http.post(
          `${this.apiUrl}/${groupId}/promote-group-admin/${userId}`,
          {},
          { headers: this.getHeaders() }
        ).pipe(
          tap(response => console.log('Promote to group admin response:', response)),
          catchError(this.handleError)
        );
      }

      promoteToSuperAdmin(userId: string): Observable<any> {
        return this.http.post(
          `${this.apiUrl}/promote-super-admin/${userId}`,
          {},
          { headers: this.getHeaders() }
        ).pipe(
          tap(response => console.log('Promote to super admin response:', response)),
          catchError(this.handleError)
        );
      }
      removeUserFromGroup(groupId: string, userId: string): Observable<any> {
        return this.http.delete(
            `${this.apiUrl}/${groupId}/members/${userId}`,
            { headers: this.getHeaders() }
        ).pipe(
            tap(response => console.log('Remove user response:', response)),
            catchError(this.handleError)
        );
    }
       
}