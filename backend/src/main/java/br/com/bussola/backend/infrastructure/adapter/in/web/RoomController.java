package br.com.bussola.backend.infrastructure.adapter.in.web;

import br.com.bussola.backend.application.room.AddRoomUseCase;
import br.com.bussola.backend.application.room.ListRoomsUseCase;
import br.com.bussola.backend.application.room.RemoveRoomUseCase;
import br.com.bussola.backend.application.room.RoomOccupancyUseCase;
import br.com.bussola.backend.infrastructure.adapter.in.web.dto.AddRoomRequest;
import br.com.bussola.backend.infrastructure.adapter.in.web.dto.RoomOccupancyResponse;
import br.com.bussola.backend.infrastructure.adapter.in.web.dto.RoomResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses/{courseId}/rooms")
public class RoomController {

    private final ListRoomsUseCase listRoomsUseCase;
    private final AddRoomUseCase addRoomUseCase;
    private final RemoveRoomUseCase removeRoomUseCase;
    private final RoomOccupancyUseCase roomOccupancyUseCase;

    public RoomController(ListRoomsUseCase listRoomsUseCase, AddRoomUseCase addRoomUseCase,
                            RemoveRoomUseCase removeRoomUseCase, RoomOccupancyUseCase roomOccupancyUseCase) {
        this.listRoomsUseCase = listRoomsUseCase;
        this.addRoomUseCase = addRoomUseCase;
        this.removeRoomUseCase = removeRoomUseCase;
        this.roomOccupancyUseCase = roomOccupancyUseCase;
    }

    @GetMapping
    public ResponseEntity<List<RoomResponse>> list(@PathVariable String courseId) {
        return ResponseEntity.ok(listRoomsUseCase.execute(courseId).stream().map(RoomResponse::from).toList());
    }

    @GetMapping("/occupancy")
    public ResponseEntity<List<RoomOccupancyResponse>> occupancy(@PathVariable String courseId,
                                                                    @RequestParam int day, @RequestParam int hour) {
        return ResponseEntity.ok(roomOccupancyUseCase.execute(courseId, day, hour).stream()
                .map(RoomOccupancyResponse::from).toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<RoomResponse> add(@PathVariable String courseId, @Valid @RequestBody AddRoomRequest request) {
        var created = addRoomUseCase.execute(courseId, request.nome());
        return ResponseEntity.status(HttpStatus.CREATED).body(RoomResponse.from(created));
    }

    @DeleteMapping("/{nome}")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<Void> remove(@PathVariable String courseId, @PathVariable String nome) {
        removeRoomUseCase.execute(courseId, nome);
        return ResponseEntity.noContent().build();
    }
}
